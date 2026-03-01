import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  keywords?: string[];
}

const SEOHead = ({ title, description, canonical, ogImage, ogType = "website", noIndex, keywords }: SEOHeadProps) => {
  useEffect(() => {
    // Set title
    document.title = title.includes("Medea") ? title : `${title} | Medea`;

    // Helper to set meta
    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, "property");
    }

    setMeta("og:title", title, "property");
    setMeta("og:type", ogType, "property");

    if (ogImage) setMeta("og:image", ogImage, "property");

    if (keywords && keywords.length > 0) {
      setMeta("keywords", keywords.join(", "));
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    if (noIndex) {
      setMeta("robots", "noindex, nofollow");
    }

    return () => {
      // Cleanup canonical
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) canonicalLink.remove();
    };
  }, [title, description, canonical, ogImage, ogType, noIndex, keywords]);

  return null;
};

export default SEOHead;
