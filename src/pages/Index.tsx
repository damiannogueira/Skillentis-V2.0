import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import FeaturesSection from "@/components/FeaturesSection";
import EvolutionPreview from "@/components/EvolutionPreview";
import PublicProfileSection from "@/components/PublicProfileSection";
import CodexaSection from "@/components/CodexaSection";
import EvolutionCard from "@/components/EvolutionCard";
import CTASection from "@/components/CTASection";
import TopDevelopersWidget from "@/components/TopDevelopersWidget";
import StatsCounter from "@/components/StatsCounter";
import RecentAnalysisWidget from "@/components/RecentAnalysisWidget";
import AnalyzeYourselfCard from "@/components/AnalyzeYourselfCard";
import Footer from "@/components/Footer";

const Index = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("es") ? "es" : "en";
  const ogLocale = t("seo.locale");

  return (
    <div className="min-h-screen bg-background">
      <Helmet htmlAttributes={{ lang }}>
        <title>{t("seo.home.title")}</title>
        <meta name="description" content={t("seo.home.description")} />
        <link rel="canonical" href="https://skillentisapp.com/" />
        <meta property="og:title" content={t("seo.home.ogTitle")} />
        <meta property="og:description" content={t("seo.home.ogDescription")} />
        <meta property="og:url" content="https://skillentisapp.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Skillentis" />
        <meta property="og:locale" content={ogLocale} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://skillentisapp.com/#org",
              name: "Skillentis",
              url: "https://skillentisapp.com/",
              logo: "https://skillentisapp.com/pwa-512x512.png",
            },
            {
              "@type": "WebSite",
              "@id": "https://skillentisapp.com/#site",
              url: "https://skillentisapp.com/",
              name: "Skillentis",
              publisher: { "@id": "https://skillentisapp.com/#org" },
            },
          ],
        })}</script>
      </Helmet>

      <Navbar />
      <main>
        <HeroSection />

        {/* Onboarding: invite to analyze own profile */}
        <AnalyzeYourselfCard />

        {/* Recent analyses (only when logged in and has history) */}
        <RecentAnalysisWidget />

        {/* 1. Problem with traditional evaluation */}
        <ProblemSection />

        {/* 2. Solution: Developer Evolution Profile */}
        <div id="features">
          <SolutionSection />
        </div>

        {/* 3. Visualization of growth metrics */}
        <FeaturesSection />

        {/* 4. Example timeline of developer evolution */}
        <EvolutionPreview />

        {/* 5. Public developer profile explanation */}
        <PublicProfileSection />

        {/* 6. Codexa Index explanation */}
        <CodexaSection />

        {/* Evolution Card showcase */}
        <EvolutionCard />

        {/* Social proof: animated stats counter */}
        <StatsCounter />

        {/* Top developers leaderboard widget */}
        <TopDevelopersWidget />

        {/* Final CTA */}
        <div id="cta">
          <CTASection />
        </div>
      </main>


      <Footer />
    </div>
  );
};

export default Index;
