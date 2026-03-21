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
    // Set title with brand format
    const brandedTitle = title.includes("MEDEA") ? title : `${title} | MEDEA Kozmetik`;
    document.title = brandedTitle;

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
      setMeta("twitter:description", description);
    }

    setMeta("og:title", brandedTitle, "property");
    setMeta("twitter:title", brandedTitle);
    setMeta("og:type", ogType, "property");
    setMeta("og:locale", "tr_TR", "property");
    setMeta("og:site_name", "MEDEA Kozmetik", "property");

    if (ogImage) {
      setMeta("og:image", ogImage, "property");
      setMeta("twitter:image", ogImage);
    }

    if (keywords && keywords.length > 0) {
      setMeta("keywords", keywords.join(", "));
    }

    if (canonical) {
      setMeta("og:url", canonical, "property");

      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.href = canonical;

      // hreflang
      let hreflang = document.querySelector('link[rel="alternate"][hreflang="tr"]') as HTMLLinkElement;
      if (!hreflang) {
        hreflang = document.createElement("link");
        hreflang.setAttribute("rel", "alternate");
        hreflang.setAttribute("hreflang", "tr");
        document.head.appendChild(hreflang);
      }
      hreflang.href = canonical;
    }

    if (noIndex) {
      setMeta("robots", "noindex, nofollow");
    }

    return () => {
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) canonicalLink.remove();
      const hreflangLink = document.querySelector('link[rel="alternate"][hreflang="tr"]');
      if (hreflangLink) hreflangLink.remove();
    };
  }, [title, description, canonical, ogImage, ogType, noIndex, keywords]);

  return null;
};

export default SEOHead;
