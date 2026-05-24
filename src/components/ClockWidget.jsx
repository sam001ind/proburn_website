/**
 * ClockWidget — web clock-in / clock-out
 * • Reads config from Firestore settings/clockin_config
 * • Location: captured if enabled for this role
 * • Biometric: WebAuthn prompt if enabled for this role
 * • Otherwise: direct tap
 *
 * Props:
 *   memberId    {string}
 *   memberName  {string}
 *   role        {'Member'|'Staff'}
 *   method      {string}
 */
import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, onSnapshot,
  addDoc, serverTimestamp, doc, getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Fingerprint, LogIn, LogOut, Clock, CheckCircle2,
  XCircle, Loader2, ShieldCheck, MapPin, MapPinOff, Settings2
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import './ClockWidget.css';

/* ── WebAuthn / Native Biometrics ────────────────────────────── */
const biometricAvailable = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch { return false; }
  }
  try {
    return !!(window.PublicKeyCredential &&
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch { return false; }
};

const promptBiometric = async (label) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await NativeBiometric.verifyIdentity({
        reason: "Please verify to log attendance",
        title: "Log Attendance",
      });
      return true;
    } catch {
      return false;
    }
  }
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Proburn Fitness' },
        user: { id: new Uint8Array(16), name: `gym_${Date.now()}`, displayName: label },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000,
      },
    });
    return !!cred;
  } catch { return false; }
};

/* ── Geolocation ─────────────────────────── */
const getLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 0 }
    );
  });

/* ── Formatters ──────────────────────────── */
const fmtTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};
const fmtDuration = (ts) => {
  if (!ts) return '';
  const ms = Date.now() - (ts.toMillis?.() ?? new Date(ts).getTime());
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};
const isToday = (ts) => {
  if (!ts) return false;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const n = new Date();
  return d.toDateString() === n.toDateString();
};

/* ══════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════ */
export default function ClockWidget({ memberId, memberName, role = 'Member', method }) {
  const logMethod = method || `Web App – ${role}`;
  const roleKey   = role === 'Staff' ? 'staff' : 'member';

  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [acting, setActing]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [nowStr, setNowStr]         = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);
  // Config from Firestore
  const [config, setConfig]         = useState({ biometric: false, location: false });
  const [configLoaded, setConfigLoaded] = useState(false);
  // Location state for UI feedback
  const [locStatus, setLocStatus]   = useState(null); // null | 'fetching' | {lat,lng,accuracy} | 'denied'
  const timerRef                    = useRef(null);

  /* Live clock */
  useEffect(() => {
    const tick = () => setNowStr(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  /* Biometric availability */
  useEffect(() => { biometricAvailable().then(setHasBiometric); }, []);

  /* ClockIn config from Firestore */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'clockin_config'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setConfig({
          biometric: d[`${roleKey}Biometric`] ?? false,
          location:  d[`${roleKey}Location`]  ?? false,
        });
      } else {
        setConfig({ biometric: false, location: false });
      }
      setConfigLoaded(true);
    });
    return () => unsub();
  }, [roleKey]);

  /* Attendance logs for this member */
  useEffect(() => {
    if (!memberId) return;
    const q = query(collection(db, 'attendance'), where('memberId', '==', memberId));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      all.sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0));
      setLogs(all);
      setLoading(false);
    }, (err) => { console.error('ClockWidget:', err); setLoading(false); });
    return () => unsub();
  }, [memberId]);

  /* Derived */
  const lastLog    = logs[0] ?? null;
  const isInside   = lastLog?.type === 'Check-In';
  const nextAction = isInside ? 'Check-Out' : 'Check-In';
  const todayLogs  = logs.filter(l => isToday(l.timestamp));
  const useBio     = config.biometric && hasBiometric;
  const useLoc     = config.location;

  /* ── Record ── */
  const record = async () => {
    setActing(true);
    try {
      // 1. Biometric gate (if enabled)
      if (useBio) {
        const ok = await promptBiometric(nextAction).catch(() => false);
        if (!ok) { setActing(false); return; }
      }

      // 2. Location capture (if enabled)
      let location = null;
      if (useLoc) {
        setLocStatus('fetching');
        location = await getLocation();
        setLocStatus(location ?? 'denied');
        setTimeout(() => setLocStatus(null), 4000);
      }

      // 3. Write to Firestore
      const methodStr = [
        logMethod,
        useBio  ? '(Biometric)' : '',
        useLoc && location ? '(GPS)' : useLoc ? '(GPS denied)' : '',
      ].filter(Boolean).join(' ');

      await addDoc(collection(db, 'attendance'), {
        memberId,
        memberName,
        type:      nextAction,
        timestamp: serverTimestamp(),
        method:    methodStr,
        role,
        ...(location ? { location } : {}),
      });

      setToast({
        msg:  nextAction === 'Check-In' ? '✅ Clocked in!' : '👋 Clocked out!',
        type: nextAction === 'Check-In' ? 'green' : 'red',
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ msg: 'Error. Please try again.', type: 'red' });
      setTimeout(() => setToast(null), 3000);
    }
    setActing(false);
  };

  /* ── Render ── */
  return (
    <div className="clock-widget">

      {/* ── Top bar ── */}
      <div className="cw-topbar">
        <div className="cw-topbar-label">
          <div className="cw-live-dot" />
          Clock-In / Clock-Out
          {useBio && (
            <span className="cw-chip blue"><ShieldCheck size={10} /> Biometric</span>
          )}
          {useLoc && (
            <span className="cw-chip green"><MapPin size={10} /> Location</span>
          )}
        </div>
        <div className="cw-clock-display">{nowStr}</div>
      </div>

      {/* ── Body ── */}
      <div className="cw-body">

        {/* Left — status */}
        <div className="cw-status-side">
          <div className="cw-status-label">Your Status</div>

          {loading ? (
            <div className="cw-status-value outside"><Loader2 size={18} className="spin" /> Loading…</div>
          ) : (
            <div className={`cw-status-value ${isInside ? 'inside' : 'outside'}`}>
              {isInside
                ? <><CheckCircle2 size={18} /> Inside Gym</>
                : <><XCircle size={18} /> Not Checked In</>
              }
            </div>
          )}

          {isInside && lastLog?.timestamp && (
            <div className="cw-duration">
              <Clock size={12} />
              Since {fmtTime(lastLog.timestamp)} · <strong>{fmtDuration(lastLog.timestamp)}</strong>
            </div>
          )}

          {/* Last location */}
          {isInside && lastLog?.location && (
            <div className="cw-loc-tag">
              <MapPin size={11} />
              {lastLog.location.lat.toFixed(5)}, {lastLog.location.lng.toFixed(5)}
              <span style={{ opacity: 0.55 }}>±{lastLog.location.accuracy}m</span>
            </div>
          )}

          <div className="cw-identity">
            <span className="cw-name">{memberName}</span>
            <span className="cw-role-id">{role} · {memberId}</span>
          </div>
        </div>

        {/* Right — action */}
        <div className="cw-action-side">
          <button
            className={`cw-btn ${acting ? 'loading' : nextAction === 'Check-In' ? 'checkin' : 'checkout'}`}
            onClick={acting ? undefined : record}
            disabled={acting || loading || !configLoaded}
            title={nextAction}
          >
            {acting
              ? <Loader2 size={28} className="spin" />
              : nextAction === 'Check-In'
                ? <><LogIn size={28} /><span className="cw-btn-label">Clock In</span></>
                : <><LogOut size={28} /><span className="cw-btn-label">Clock Out</span></>
            }
          </button>

          {/* Hints */}
          <div className="cw-hints">
            {useBio
              ? <span className="cw-hint-item"><Fingerprint size={12} /> Biometric required</span>
              : <span className="cw-hint-item muted">Tap to {nextAction === 'Check-In' ? 'clock in' : 'clock out'}</span>
            }
            {useLoc
              ? <span className="cw-hint-item"><MapPin size={12} /> Location will be captured</span>
              : <span className="cw-hint-item muted"><MapPinOff size={12} /> No location tracking</span>
            }
          </div>
        </div>
      </div>

      {/* Location status bar */}
      {locStatus && (
        <div className={`cw-loc-bar ${locStatus === 'fetching' ? 'fetching' : locStatus === 'denied' ? 'denied' : 'ok'}`}>
          {locStatus === 'fetching' && <><Loader2 size={13} className="spin" /> Getting your location…</>}
          {locStatus === 'denied'   && <><XCircle size={13} /> Location denied — punch recorded without GPS</>}
          {locStatus?.lat           && <><MapPin size={13} /> Captured: {locStatus.lat.toFixed(4)}, {locStatus.lng.toFixed(4)} (±{locStatus.accuracy}m)</>}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div key={toast.msg} className={`cw-toast ${toast.type}`}>
          {toast.type === 'green' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Today's log */}
      {todayLogs.length > 0 && (
        <div className="cw-log">
          <div className="cw-log-header">Today ({todayLogs.length} entries)</div>
          <div className="cw-log-list">
            {todayLogs.map(l => (
              <div key={l.id} className="cw-log-row">
                <span className="time">{fmtTime(l.timestamp)}</span>
                <span className={`type-badge ${l.type === 'Check-In' ? 'in' : 'out'}`}>
                  {l.type === 'Check-In' ? <LogIn size={10} /> : <LogOut size={10} />}
                  {l.type}
                </span>
                {l.location && (
                  <span className="cw-log-gps" title={`${l.location.lat}, ${l.location.lng}`}>
                    <MapPin size={10} /> GPS
                  </span>
                )}
                <span className="method">{l.method}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
