"use client";

// src/admin/views/HomePageManager.tsx
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfirmActionDialog from "@admin/views/ConfirmActionDialog";
import ContentPageEditor from "@admin/views/ContentPageEditor";
import HomeSectionEditor from "@admin/views/HomeSectionEditor";
import MediaPickerModal from "@admin/views/MediaPickerModal";
import {
  HOME_SECTION_TYPES,
  createHomeItem,
  createHomeSection,
  defaultHomePageSettings,
  homeSectionMeta
} from "@/libs/home-types";
import {
  SITE_PAGES,
  createContentAction,
  createContentBlock,
  defaultContentPage,
  getSitePage
} from "@/libs/site-pages";
import { jsx, jsxs } from "react/jsx-runtime";
var thumbBox = {
  width: "100%",
  height: 54,
  borderRadius: 1.5,
  overflow: "hidden",
  bgcolor: "action.hover",
  border: "1px solid",
  borderColor: "divider",
  p: 0.75,
  display: "flex",
  alignItems: "stretch",
  gap: 0.5
};
var Block = ({ w = "100%", h = "100%", soft = false }) => /* @__PURE__ */ jsx(Box, { sx: { width: w, height: h, borderRadius: 0.75, bgcolor: soft ? "action.selected" : "primary.main", opacity: soft ? 0.55 : 0.85 } });
var SectionThumb = ({ type }) => {
  if (type === "hero") {
    return /* @__PURE__ */ jsxs(Box, { sx: thumbBox, children: [
      /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.5, pr: 1 }, children: [
        /* @__PURE__ */ jsx(Block, { w: "70%", h: 6 }),
        /* @__PURE__ */ jsx(Block, { w: "45%", h: 4, soft: true }),
        /* @__PURE__ */ jsxs(Box, { sx: { display: "flex", gap: 0.5, mt: 0.25 }, children: [
          /* @__PURE__ */ jsx(Block, { w: 28, h: 8 }),
          /* @__PURE__ */ jsx(Block, { w: 22, h: 8, soft: true })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Block, { w: "42%", h: "100%", soft: true })
    ] });
  }
  if (type === "trust") {
    return /* @__PURE__ */ jsx(Box, { sx: { ...thumbBox, alignItems: "center", justifyContent: "space-between", px: 1 }, children: [0, 1, 2, 3].map((item) => /* @__PURE__ */ jsxs(Box, { sx: { display: "flex", flexDirection: "column", alignItems: "center", gap: 0.4, flex: 1 }, children: [
      /* @__PURE__ */ jsx(Box, { sx: { width: 14, height: 14, borderRadius: "50%", bgcolor: "primary.main", opacity: 0.8 } }),
      /* @__PURE__ */ jsx(Block, { w: "70%", h: 3, soft: true })
    ] }, item)) });
  }
  if (type === "products") {
    return /* @__PURE__ */ jsx(Box, { sx: thumbBox, children: [0, 1, 2, 3].map((item) => /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, display: "flex", flexDirection: "column", gap: 0.4 }, children: [
      /* @__PURE__ */ jsx(Block, { h: 28, soft: true }),
      /* @__PURE__ */ jsx(Block, { h: 4 }),
      /* @__PURE__ */ jsx(Block, { h: 3, soft: true })
    ] }, item)) });
  }
  if (type === "cards") {
    return /* @__PURE__ */ jsx(Box, { sx: thumbBox, children: [0, 1, 2].map((item) => /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, position: "relative" }, children: [
      /* @__PURE__ */ jsx(Block, { h: "100%", soft: true }),
      /* @__PURE__ */ jsx(Box, { sx: { position: "absolute", left: 4, right: 4, bottom: 4 }, children: /* @__PURE__ */ jsx(Block, { h: 5 }) })
    ] }, item)) });
  }
  if (type === "video") {
    return /* @__PURE__ */ jsxs(Box, { sx: { ...thumbBox, alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, display: "flex", flexDirection: "column", gap: 0.5, pr: 0.5 }, children: [
        /* @__PURE__ */ jsx(Block, { w: "55%", h: 5, soft: true }),
        /* @__PURE__ */ jsx(Block, { w: "80%", h: 7 }),
        /* @__PURE__ */ jsx(Block, { w: 36, h: 8 })
      ] }),
      /* @__PURE__ */ jsx(Box, { sx: { width: "40%", height: "100%", borderRadius: 1, bgcolor: "primary.main", opacity: 0.75, display: "grid", placeItems: "center" }, children: /* @__PURE__ */ jsx("i", { className: "tabler-player-play text-white text-sm" }) })
    ] });
  }
  if (type === "story") {
    return /* @__PURE__ */ jsxs(Box, { sx: thumbBox, children: [
      /* @__PURE__ */ jsx(Block, { w: "46%", h: "100%", soft: true }),
      /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.5 }, children: [
        /* @__PURE__ */ jsx(Block, { w: "40%", h: 4, soft: true }),
        /* @__PURE__ */ jsx(Block, { w: "85%", h: 6 }),
        /* @__PURE__ */ jsx(Block, { w: "95%", h: 3, soft: true }),
        /* @__PURE__ */ jsx(Block, { w: "70%", h: 3, soft: true }),
        /* @__PURE__ */ jsx(Block, { w: 34, h: 7 })
      ] })
    ] });
  }
  if (type === "features") {
    return /* @__PURE__ */ jsx(Box, { sx: { ...thumbBox, alignItems: "center" }, children: [0, 1, 2, 3].map((item) => /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.4 }, children: [
      /* @__PURE__ */ jsx(Box, { sx: { width: 16, height: 16, borderRadius: 1, bgcolor: "primary.main", opacity: 0.8 } }),
      /* @__PURE__ */ jsx(Block, { w: "80%", h: 3 }),
      /* @__PURE__ */ jsx(Block, { w: "60%", h: 2, soft: true })
    ] }, item)) });
  }
  if (type === "festivities") {
    return /* @__PURE__ */ jsxs(Box, { sx: { ...thumbBox, alignItems: "end" }, children: [
      /* @__PURE__ */ jsx(Block, { w: "22%", h: "70%", soft: true }),
      /* @__PURE__ */ jsx(Block, { w: "34%", h: "100%" }),
      /* @__PURE__ */ jsx(Block, { w: "22%", h: "70%", soft: true }),
      /* @__PURE__ */ jsx(Block, { w: "22%", h: "55%", soft: true })
    ] });
  }
  if (type === "fan") {
    return /* @__PURE__ */ jsxs(Box, { sx: { ...thumbBox, alignItems: "end", justifyContent: "center" }, children: [
      /* @__PURE__ */ jsx(Box, { sx: { width: "28%", height: "72%", borderRadius: 1, bgcolor: "action.selected", transform: "rotate(-12deg) translateY(4px)" } }),
      /* @__PURE__ */ jsx(Box, { sx: { width: "34%", height: "92%", borderRadius: 1, bgcolor: "primary.main", opacity: 0.85, zIndex: 1 } }),
      /* @__PURE__ */ jsx(Box, { sx: { width: "28%", height: "72%", borderRadius: 1, bgcolor: "action.selected", transform: "rotate(12deg) translateY(4px)" } })
    ] });
  }
  if (type === "navratri") {
    return /* @__PURE__ */ jsx(Box, { sx: thumbBox, children: [0, 1].map((item) => /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, display: "flex", gap: 0.5 }, children: [
      /* @__PURE__ */ jsx(Block, { w: "42%", h: "100%", soft: true }),
      /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.4 }, children: [
        /* @__PURE__ */ jsx(Block, { h: 4, soft: true }),
        /* @__PURE__ */ jsx(Block, { h: 5 }),
        /* @__PURE__ */ jsx(Block, { h: 3, soft: true })
      ] })
    ] }, item)) });
  }
  return /* @__PURE__ */ jsx(Box, { sx: { ...thumbBox, alignItems: "center" }, children: [0, 1, 2].map((item) => /* @__PURE__ */ jsxs(Box, { sx: { flex: 1, display: "flex", flexDirection: "column", gap: 0.4, p: 0.25 }, children: [
    /* @__PURE__ */ jsx(Box, { sx: { display: "flex", gap: 0.3 }, children: [0, 1, 2, 3, 4].map((star) => /* @__PURE__ */ jsx(Box, { sx: { width: 5, height: 5, borderRadius: "1px", bgcolor: "warning.main", opacity: 0.9 } }, star)) }),
    /* @__PURE__ */ jsx(Block, { h: 3, soft: true }),
    /* @__PURE__ */ jsx(Block, { h: 3, soft: true }),
    /* @__PURE__ */ jsx(Block, { w: "50%", h: 3 })
  ] }, item)) });
};
var HomePageManager = () => {
  const params = useParams();
  const lang = String(params?.lang || "en");
  const [pageId, setPageId] = useState("home");
  const activePage = getSitePage(pageId);
  const [settings, setSettings] = useState(defaultHomePageSettings());
  const [contentSettings, setContentSettings] = useState(defaultContentPage("about"));
  const [products, setProducts] = useState([]);
  const [mediaFor, setMediaFor] = useState(null);
  const [contentMediaField, setContentMediaField] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState("hero");
  const [device, setDevice] = useState("desktop");
  const [addType, setAddType] = useState("products");
  const [productSearch, setProductSearch] = useState("");
  const [pickerCollection, setPickerCollection] = useState("all");
  const [confirm, setConfirm] = useState(null);
  const frameRef = useRef(null);
  const localEdit = useRef(false);
  const contentEdit = useRef(false);
  const [previewReady, setPreviewReady] = useState(false);
  const sectionRefs = useRef({});
  useEffect(() => {
    fetch("/api/admin/home-page").then((res) => res.json()).then((json) => {
      if (!localEdit.current && json?.sections) setSettings(json);
    }).catch(() => void 0);
    fetch("/api/web/products").then((res) => res.json()).then((json) => {
      const rows = Array.isArray(json) ? json : [];
      setProducts(
        rows.map((row) => ({
          slug: String(row.slug || ""),
          title: String(row.title || row.slug || ""),
          image: String(row.image || ""),
          collections: Array.isArray(row.collections) ? row.collections.map(String) : []
        })).filter((row) => row.slug)
      );
    }).catch(() => void 0);
  }, []);
  useEffect(() => {
    if (activePage.kind !== "content") return;
    contentEdit.current = false;
    setContentSettings(defaultContentPage(pageId));
    fetch(`/api/admin/content-page?page=${encodeURIComponent(pageId)}`).then((res) => res.json()).then((json) => {
      if (!contentEdit.current && json?.title) setContentSettings(json);
    }).catch(() => void 0);
    setPreviewReady(false);
  }, [pageId, activePage.kind]);
  const updateSection = (id, patch) => {
    localEdit.current = true;
    setSettings((current) => ({
      sections: current.sections.map((section) => section.id === id ? { ...section, ...patch } : section)
    }));
  };
  const toggleProduct = (sectionId, slug) => {
    localEdit.current = true;
    setSettings((current) => ({
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const exists = section.productSlugs.includes(slug);
        const productSlugs = exists ? section.productSlugs.filter((item) => item !== slug) : [...section.productSlugs, slug];
        return {
          ...section,
          productMode: "selected",
          productSlugs,
          limit: Math.max(productSlugs.length || 1, section.limit || 8)
        };
      })
    }));
  };
  const moveSelectedProduct = (sectionId, slug, direction) => {
    localEdit.current = true;
    setSettings((current) => ({
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const next = [...section.productSlugs];
        const index = next.indexOf(slug);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= next.length) return section;
        [next[index], next[target]] = [next[target], next[index]];
        return { ...section, productSlugs: next };
      })
    }));
  };
  const updateItem = (sectionId, itemId, patch) => {
    localEdit.current = true;
    setSettings((current) => ({
      sections: current.sections.map(
        (section) => section.id === sectionId ? { ...section, items: section.items.map((item) => item.id === itemId ? { ...item, ...patch } : item) } : section
      )
    }));
  };
  const addItem = (sectionId) => {
    localEdit.current = true;
    const section = settings.sections.find((row) => row.id === sectionId);
    const created = createHomeItem({
      title: "New item",
      showText: section?.type === "features" || section?.type === "hero",
      showKicker: section?.type === "hero",
      showButton: section?.type === "hero" || section?.type === "cards",
      icon: section?.type === "trust" ? "tabler-shield-check" : "tabler-sparkles"
    });
    setSettings((current) => ({
      sections: current.sections.map((row) => row.id === sectionId ? { ...row, items: [...row.items, created] } : row)
    }));
  };
  const removeItem = (sectionId, itemId) => {
    localEdit.current = true;
    setSettings((current) => ({
      sections: current.sections.map(
        (section) => section.id === sectionId ? { ...section, items: section.items.filter((item) => item.id !== itemId) } : section
      )
    }));
  };
  const moveItem = (sectionId, itemId, direction) => {
    localEdit.current = true;
    setSettings((current) => ({
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const next = [...section.items];
        const index = next.findIndex((item) => item.id === itemId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= next.length) return section;
        [next[index], next[target]] = [next[target], next[index]];
        return { ...section, items: next };
      })
    }));
  };
  const addSection = (type = addType) => {
    localEdit.current = true;
    const created = createHomeSection(type);
    setSettings((current) => ({ sections: [...current.sections, created] }));
    setSelectedId(created.id);
    setAddType(type);
  };
  const removeSection = (id) => {
    const target = settings.sections.find((section) => section.id === id);
    if (!target || target.locked) return;
    setConfirm({
      title: "Remove this section?",
      message: `\u201C${target.title || target.id}\u201D will be removed from the home page. Built-in sections cannot be removed \u2014 this is a section you added.`,
      action: () => {
        localEdit.current = true;
        setSettings((current) => ({ sections: current.sections.filter((section) => section.id !== id) }));
        setSelectedId((current) => current === id ? null : current);
      }
    });
  };
  const requestRemoveItem = (sectionId, itemId, title) => {
    setConfirm({
      title: "Remove this item?",
      message: `\u201C${title}\u201D will be removed from this section. You can add it again later if needed.`,
      action: () => removeItem(sectionId, itemId)
    });
  };
  const move = (index, direction) => {
    localEdit.current = true;
    setSettings((current) => {
      const next = [...current.sections];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return { sections: next };
    });
  };
  const save = async () => {
    if (activePage.kind === "contact") {
      setMessage("Open Contact page settings to edit phone, WhatsApp and address.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    if (activePage.kind === "content") {
      const res2 = await fetch("/api/admin/content-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contentSettings, page: pageId })
      });
      const json2 = await res2.json();
      setSaving(false);
      if (!res2.ok) {
        setError(json2.message || "Could not save page");
        return;
      }
      setContentSettings(json2);
      setMessage(`${activePage.label} page saved.`);
      return;
    }
    const res = await fetch("/api/admin/home-page", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.message || "Could not save home page");
      return;
    }
    setSettings(json);
    setMessage("Home page saved.");
  };
  const pickMedia = (media) => {
    if (contentMediaField) {
      contentEdit.current = true;
      setContentSettings((current) => ({ ...current, [contentMediaField]: media.url }));
      setContentMediaField(null);
      return;
    }
    if (!mediaFor) return;
    const patch = { [mediaFor.field]: media.url };
    if (mediaFor.itemId) updateItem(mediaFor.sectionId, mediaFor.itemId, patch);
    else updateSection(mediaFor.sectionId, patch);
    setMediaFor(null);
  };
  const pushPreview = () => {
    if (activePage.kind === "home") {
      frameRef.current?.contentWindow?.postMessage({ type: "jagu-home-draft", settings }, window.location.origin);
      return;
    }
    if (activePage.kind === "content") {
      frameRef.current?.contentWindow?.postMessage(
        { type: "jagu-content-draft", page: pageId, settings: contentSettings },
        window.location.origin
      );
    }
  };
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "jagu-home-ready" || event.data?.type === "jagu-content-ready") setPreviewReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  useEffect(() => {
    if (!previewReady) return;
    pushPreview();
  }, [settings, contentSettings, previewReady, pageId]);
  const selected = selectedId ? settings.sections.find((section) => section.id === selectedId) || null : null;
  const focusSection = (id, forceOpen = false) => {
    if (!forceOpen && selectedId === id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(id);
    frameRef.current?.contentWindow?.postMessage({ type: "jagu-home-scroll", id }, window.location.origin);
    window.setTimeout(() => {
      sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  };
  const closeSection = () => setSelectedId(null);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-[calc(100vh-140px)] flex-col gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Typography, { variant: "h4", children: "Website editor" }),
        /* @__PURE__ */ jsx(Typography, { color: "text.secondary", children: "Select a page on top. Edit on the left. Live preview stays on the right." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: device === "desktop" ? "contained" : "outlined", startIcon: /* @__PURE__ */ jsx("i", { className: "tabler-device-desktop" }), onClick: () => setDevice("desktop"), children: "Desktop" }),
        /* @__PURE__ */ jsx(Button, { variant: device === "mobile" ? "contained" : "outlined", startIcon: /* @__PURE__ */ jsx("i", { className: "tabler-device-mobile" }), onClick: () => setDevice("mobile"), children: "Mobile" }),
        /* @__PURE__ */ jsx(Button, { variant: "contained", disabled: saving || activePage.kind === "contact", startIcon: /* @__PURE__ */ jsx("i", { className: "tabler-device-floppy" }), onClick: () => void save(), children: saving ? "Saving\u2026" : "Save" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Card, { sx: { borderRadius: 3 }, children: /* @__PURE__ */ jsxs(CardContent, { sx: { py: 2, "&:last-child": { pb: 2 } }, children: [
      /* @__PURE__ */ jsx(Typography, { variant: "subtitle2", className: "mbe-2", children: "Select page" }),
      /* @__PURE__ */ jsx(Stack, { direction: "row", spacing: 1, useFlexGap: true, flexWrap: "wrap", children: SITE_PAGES.map((page) => {
        const active = pageId === page.id;
        return /* @__PURE__ */ jsx(
          Chip,
          {
            clickable: true,
            color: active ? "primary" : "default",
            variant: active ? "filled" : "outlined",
            icon: /* @__PURE__ */ jsx("i", { className: `${page.icon} text-base` }),
            label: page.label,
            onClick: () => setPageId(page.id),
            sx: { height: 36, px: 0.5 }
          },
          page.id
        );
      }) }),
      /* @__PURE__ */ jsxs(Typography, { variant: "caption", color: "text.secondary", sx: { display: "block", mt: 1.5 }, children: [
        activePage.hint,
        " \xB7 Preview: ",
        activePage.path
      ] })
    ] }) }),
    message ? /* @__PURE__ */ jsx(Alert, { severity: "success", children: message }) : null,
    error ? /* @__PURE__ */ jsx(Alert, { severity: "error", children: error }) : null,
    /* @__PURE__ */ jsxs("div", { className: "grid min-h-0 flex-1 gap-4 lg:grid-cols-[460px_minmax(0,1fr)]", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-h-[calc(100vh-180px)] overflow-auto pe-1", children: [
        activePage.kind === "contact" ? /* @__PURE__ */ jsx(Card, { sx: { borderRadius: 3 }, children: /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx(Typography, { variant: "h6", className: "mbe-1", children: "Contact page" }),
          /* @__PURE__ */ jsx(Typography, { color: "text.secondary", className: "mbe-3", children: "Phone, WhatsApp, hours and atelier address are edited in Contact page settings." }),
          /* @__PURE__ */ jsx(Button, { component: Link, href: `/${lang}/store/contact-page`, variant: "contained", startIcon: /* @__PURE__ */ jsx("i", { className: "tabler-mail" }), children: "Open contact settings" })
        ] }) }) : null,
        activePage.kind === "content" ? /* @__PURE__ */ jsx(Card, { sx: { borderRadius: 3 }, children: /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
          ContentPageEditor,
          {
            settings: contentSettings,
            onChange: (next) => {
              contentEdit.current = true;
              setContentSettings(next);
            },
            onPickMedia: (field) => setContentMediaField(field),
            onAddBlock: () => {
              contentEdit.current = true;
              setContentSettings((current) => ({ ...current, blocks: [...current.blocks, createContentBlock()] }));
            },
            onRemoveBlock: (id) => {
              setConfirm({
                title: "Remove this section?",
                message: "This content block will be removed from the page.",
                action: () => {
                  contentEdit.current = true;
                  setContentSettings((current) => ({ ...current, blocks: current.blocks.filter((block) => block.id !== id) }));
                }
              });
            },
            onAddAction: () => {
              contentEdit.current = true;
              setContentSettings((current) => ({ ...current, actions: [...current.actions, createContentAction()] }));
            },
            onRemoveAction: (id) => {
              setConfirm({
                title: "Remove this button?",
                message: "This button will be removed from the page.",
                action: () => {
                  contentEdit.current = true;
                  setContentSettings((current) => ({ ...current, actions: current.actions.filter((action) => action.id !== id) }));
                }
              });
            }
          }
        ) }) }) : null,
        activePage.kind === "home" ? /* @__PURE__ */ jsxs(Box, { children: [
          /* @__PURE__ */ jsx(Typography, { variant: "subtitle2", className: "mbe-2", children: "Page sections" }),
          /* @__PURE__ */ jsx(Stack, { spacing: 2, className: "mbe-3", children: settings.sections.map((section, index) => {
            const meta = homeSectionMeta(section.type);
            const active = selected?.id === section.id;
            return /* @__PURE__ */ jsxs(
              Box,
              {
                ref: (node) => {
                  sectionRefs.current[section.id] = node;
                },
                sx: {
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: active ? "primary.main" : "divider",
                  bgcolor: "background.paper",
                  overflow: "hidden",
                  boxShadow: active ? 4 : 0,
                  transition: "border-color .2s ease, box-shadow .2s ease"
                },
                children: [
                  /* @__PURE__ */ jsx(
                    Box,
                    {
                      onClick: () => focusSection(section.id),
                      sx: {
                        cursor: "pointer",
                        p: 1.75,
                        bgcolor: active ? "action.selected" : "transparent",
                        "&:hover": { bgcolor: active ? "action.selected" : "action.hover" }
                      },
                      children: /* @__PURE__ */ jsxs(Box, { className: "flex items-start gap-3", children: [
                        /* @__PURE__ */ jsx(
                          Box,
                          {
                            sx: {
                              width: 44,
                              height: 44,
                              borderRadius: 2,
                              display: "grid",
                              placeItems: "center",
                              bgcolor: active ? "primary.main" : "action.hover",
                              color: active ? "primary.contrastText" : "text.secondary",
                              flexShrink: 0
                            },
                            children: /* @__PURE__ */ jsx("i", { className: `${meta.icon} text-xl` })
                          }
                        ),
                        /* @__PURE__ */ jsxs(Box, { className: "min-w-0 flex-1", children: [
                          /* @__PURE__ */ jsxs(Box, { className: "flex flex-wrap items-center gap-1", children: [
                            /* @__PURE__ */ jsx(Typography, { className: "font-medium leading-tight", children: section.title || meta.label }),
                            /* @__PURE__ */ jsx(Chip, { size: "small", label: meta.label, variant: "outlined", sx: { height: 20 } }),
                            section.locked ? /* @__PURE__ */ jsx(Chip, { size: "small", label: "Built in", sx: { height: 20 } }) : /* @__PURE__ */ jsx(Chip, { size: "small", label: "Custom", color: "info", sx: { height: 20 } }),
                            !section.enabled ? /* @__PURE__ */ jsx(Chip, { size: "small", label: "Hidden", color: "warning", sx: { height: 20 } }) : null
                          ] }),
                          /* @__PURE__ */ jsx(Typography, { variant: "caption", color: "text.secondary", className: "block mbs-1", children: meta.hint }),
                          /* @__PURE__ */ jsx(Box, { className: "mts-2", children: /* @__PURE__ */ jsx(SectionThumb, { type: section.type }) }),
                          /* @__PURE__ */ jsxs(Box, { className: "mt-2 flex items-center gap-1", children: [
                            /* @__PURE__ */ jsx(IconButton, { size: "small", onClick: (event) => {
                              event.stopPropagation();
                              move(index, -1);
                            }, "aria-label": "Move up", children: /* @__PURE__ */ jsx("i", { className: "tabler-arrow-up" }) }),
                            /* @__PURE__ */ jsx(IconButton, { size: "small", onClick: (event) => {
                              event.stopPropagation();
                              move(index, 1);
                            }, "aria-label": "Move down", children: /* @__PURE__ */ jsx("i", { className: "tabler-arrow-down" }) }),
                            section.locked ? null : /* @__PURE__ */ jsx(IconButton, { size: "small", color: "error", onClick: (event) => {
                              event.stopPropagation();
                              removeSection(section.id);
                            }, "aria-label": "Remove section", children: /* @__PURE__ */ jsx("i", { className: "tabler-trash" }) }),
                            /* @__PURE__ */ jsx(
                              Chip,
                              {
                                size: "small",
                                color: active ? "primary" : "default",
                                variant: active ? "filled" : "outlined",
                                clickable: true,
                                onClick: (event) => {
                                  event.stopPropagation();
                                  if (active) closeSection();
                                  else focusSection(section.id, true);
                                },
                                icon: /* @__PURE__ */ jsx("i", { className: active ? "tabler-chevron-up" : "tabler-chevron-down" }),
                                label: active ? "Close settings" : "Open settings",
                                sx: { ml: "auto", height: 24 }
                              }
                            )
                          ] })
                        ] })
                      ] })
                    }
                  ),
                  /* @__PURE__ */ jsxs(Collapse, { in: active, timeout: "auto", unmountOnExit: true, children: [
                    /* @__PURE__ */ jsx(Divider, {}),
                    /* @__PURE__ */ jsx(Box, { sx: { p: 2, bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "grey.50" }, children: /* @__PURE__ */ jsx(
                      HomeSectionEditor,
                      {
                        section,
                        products,
                        productSearch,
                        pickerCollection,
                        onProductSearch: setProductSearch,
                        onPickerCollection: setPickerCollection,
                        onUpdateSection: updateSection,
                        onUpdateItem: updateItem,
                        onAddItem: addItem,
                        onRequestRemoveItem: requestRemoveItem,
                        onMoveItem: moveItem,
                        onToggleProduct: toggleProduct,
                        onMoveSelectedProduct: moveSelectedProduct,
                        onPickMedia: (sectionId, itemId, field = "image") => setMediaFor({ sectionId, itemId, field })
                      }
                    ) })
                  ] })
                ]
              },
              section.id
            );
          }) }),
          /* @__PURE__ */ jsx(Card, { sx: { borderRadius: 3 }, children: /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsx(Typography, { variant: "subtitle2", className: "mbe-1", children: "Add a section" }),
            /* @__PURE__ */ jsx(Typography, { variant: "caption", color: "text.secondary", className: "block mbe-3", children: "Pick a look below. Built-in sections stay. Only a section you add can be removed after confirm." }),
            /* @__PURE__ */ jsx(Grid, { container: true, spacing: 2, children: HOME_SECTION_TYPES.map((option) => {
              const active = addType === option.type;
              return /* @__PURE__ */ jsx(Grid, { size: { xs: 12, sm: 6 }, children: /* @__PURE__ */ jsxs(
                Box,
                {
                  onClick: () => setAddType(option.type),
                  sx: {
                    cursor: "pointer",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: active ? "primary.main" : "divider",
                    bgcolor: active ? "action.selected" : "background.paper",
                    p: 1.25,
                    height: "100%"
                  },
                  children: [
                    /* @__PURE__ */ jsxs(Box, { className: "mb-2 flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Box, { sx: { width: 32, height: 32, borderRadius: 1.25, display: "grid", placeItems: "center", bgcolor: active ? "primary.main" : "action.hover", color: active ? "primary.contrastText" : "text.secondary" }, children: /* @__PURE__ */ jsx("i", { className: `${option.icon} text-lg` }) }),
                      /* @__PURE__ */ jsxs(Box, { children: [
                        /* @__PURE__ */ jsx(Typography, { className: "font-medium leading-tight", children: option.label }),
                        /* @__PURE__ */ jsx(Typography, { variant: "caption", color: "text.secondary", children: option.hint })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx(SectionThumb, { type: option.type })
                  ]
                }
              ) }, option.type);
            }) }),
            /* @__PURE__ */ jsxs(Button, { className: "mts-3", fullWidth: true, variant: "contained", startIcon: /* @__PURE__ */ jsx("i", { className: "tabler-plus" }), onClick: () => addSection(addType), children: [
              "Add ",
              homeSectionMeta(addType).label
            ] })
          ] }) })
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex min-h-[70vh] flex-col gap-2", children: [
        /* @__PURE__ */ jsxs(Box, { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(Typography, { variant: "subtitle2", children: "Live website preview" }),
          /* @__PURE__ */ jsx(Chip, { size: "small", icon: /* @__PURE__ */ jsx("i", { className: `${activePage.icon} text-base` }), label: activePage.label })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex min-h-[70vh] items-start justify-center overflow-auto rounded border bg-neutral-100 p-3", children: /* @__PURE__ */ jsx(
          "iframe",
          {
            ref: frameRef,
            title: "Live website",
            src: activePage.path,
            onLoad: () => setPreviewReady(true),
            className: "h-[78vh] border-0 bg-white shadow",
            style: { width: device === "mobile" ? 390 : "100%" }
          },
          activePage.path
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      MediaPickerModal,
      {
        open: Boolean(mediaFor) || Boolean(contentMediaField),
        file: null,
        onClose: () => {
          setMediaFor(null);
          setContentMediaField(null);
        },
        onSelect: pickMedia
      }
    ),
    /* @__PURE__ */ jsx(
      ConfirmActionDialog,
      {
        open: Boolean(confirm),
        title: confirm?.title,
        message: confirm?.message || "",
        confirmLabel: "Remove",
        cancelLabel: "Keep",
        onClose: () => setConfirm(null),
        onConfirm: () => {
          confirm?.action();
          setConfirm(null);
        }
      }
    )
  ] });
};
var HomePageManager_default = HomePageManager;
export {
  HomePageManager_default as default
};
