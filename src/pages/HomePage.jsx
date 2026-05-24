import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Classes from '../components/Classes';
import Pricing from '../components/Pricing';
import CustomSections from '../components/CustomSections';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Classes />
      <Pricing />
      <CustomSections />
      <Footer />
    </>
  );
}
