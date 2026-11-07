import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Highlights } from "./components/Highlights";
import { Collection } from "./components/Collection";
import { CustomOrders } from "./components/CustomOrders";
import { Process } from "./components/Process";
import { Story } from "./components/Story";
import { Faq } from "./components/Faq";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { SewProgress } from "./components/SewProgress";
import { StitchDefs } from "./components/StitchDefs";
import { useReveal } from "./hooks/useReveal";

export default function App() {
  useReveal();
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <StitchDefs />
      <SewProgress />
      <Header />
      <main id="main">
        <Hero />
        <Highlights />
        <Collection />
        <CustomOrders />
        <Process />
        <Story />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
