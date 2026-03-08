import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  FilePlus, FolderPlus, Upload, Trash2, Edit3, Download, File, Folder, FolderOpen,
  ChevronRight, ChevronDown, RefreshCw, Search, FileText, FileImage, FileArchive,
  FileCode, Eye, Copy, HardDrive, Save, Home, ArrowLeft, ArrowRight, ArrowUp,
  CheckSquare, XSquare, Move, Scissors, FileArchive as Archive, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { projectFilePaths } from "@/data/projectFilePaths";

// ── Types ──────────────────────────────────────────────
type NodeType = "bucket" | "folder" | "file";
type NodeSource = "storage" | "project";

interface TreeNode {
  name: string;
  path: string;
  type: NodeType;
  source: NodeSource;
  bucketId?: string;
  children?: TreeNode[];
  loaded?: boolean;
  expanded?: boolean;
  metadata?: { size?: number; mimetype?: string; lastModified?: string };
  isPublic?: boolean;
  created_at?: string;
}

const PROJECT_ROOT_PATH = "project";

// ── Helpers ────────────────────────────────────────────
const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"].includes(ext)) return FileImage;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  if (["html", "css", "js", "ts", "tsx", "jsx", "json", "xml", "php", "py", "sql", "toml", "yml", "yaml"].includes(ext)) return FileCode;
  if (["txt", "md", "csv", "log", "pdf", "doc", "docx"].includes(ext)) return FileText;
  return File;
};

const formatSize = (bytes?: number) => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isEditable = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["txt", "md", "html", "css", "js", "ts", "tsx", "jsx", "json", "xml", "csv", "log", "env", "yml", "yaml", "toml", "php", "py", "sql"].includes(ext);
};

const isPreviewable = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "pdf"].includes(ext);
};

const formatDate = (d?: string) => {
  if (!d) return "-";
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

const getFileType = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    html: "text/html", css: "text/css", js: "text/javascript", ts: "text/typescript",
    tsx: "text/tsx", jsx: "text/jsx", json: "application/json", xml: "text/xml",
    svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", webp: "image/webp", ico: "image/x-icon", pdf: "application/pdf",
    zip: "application/zip", md: "text/markdown", txt: "text/plain", csv: "text/csv",
    toml: "text/toml", yml: "text/yaml", yaml: "text/yaml", php: "text/x-php",
    py: "text/x-python", sql: "text/x-sql",
  };
  return map[ext] || ext.toUpperCase();
};

// ── Build project tree from static paths ───────────────
const buildProjectTree = (): TreeNode => {
  const root: TreeNode = {
    name: "Web Dosyaları", path: PROJECT_ROOT_PATH, type: "folder", source: "project",
    expanded: true, loaded: true, children: [],
  };

  const ensureFolder = (parent: TreeNode, folderName: string, fullPath: string): TreeNode => {
    parent.children ||= [];
    let folder = parent.children.find((c) => c.type === "folder" && c.name === folderName && c.source === "project");
    if (!folder) {
      folder = { name: folderName, path: fullPath, type: "folder", source: "project", expanded: false, loaded: true, children: [] };
      parent.children.push(folder);
      parent.children.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, "tr") : a.type === "folder" ? -1 : 1));
    }
    return folder;
  };

  for (const rawPath of projectFilePaths) {
    const parts = rawPath.split("/");
    let current = root;
    parts.forEach((part, index) => {
      const currentPath = `${PROJECT_ROOT_PATH}/${parts.slice(0, index + 1).join("/")}`;
      if (index === parts.length - 1) {
        current.children ||= [];
        current.children.push({ name: part, path: currentPath, type: "file", source: "project", loaded: true });
        current.children.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, "tr") : a.type === "folder" ? -1 : 1));
      } else {
        current = ensureFolder(current, part, currentPath);
      }
    });
  }
  return root;
};

// ── Tree Item ──────────────────────────────────────────
const TreeItem = ({ node, depth, selectedPath, onSelect, onToggle }: {
  node: TreeNode; depth: number; selectedPath: string;
  onSelect: (n: TreeNode) => void; onToggle: (n: TreeNode) => void;
}) => {
  const isSelected = selectedPath === node.path;
  const isFolder = node.type !== "file";
  const Icon = node.type === "bucket" ? HardDrive : isFolder ? (node.expanded ? FolderOpen : Folder) : getFileIcon(node.name);

  return (
    <>
      <button
        onClick={() => { if (isFolder) onToggle(node); onSelect(node); }}
        className={cn(
          "w-full flex items-center gap-1 py-[3px] px-1 text-[11px] text-left hover:bg-accent/50 transition-colors",
          isSelected && "bg-primary/10 text-primary font-medium"
        )}
        style={{ paddingLeft: `${6 + depth * 12}px` }}
      >
        {isFolder ? (
          <span className="w-3 h-3 flex items-center justify-center shrink-0">
            {node.expanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
          </span>
        ) : <span className="w-3 shrink-0" />}
        <Icon className={cn("h-3.5 w-3.5 shrink-0", isFolder ? "text-primary" : "text-muted-foreground")} />
        <span className="truncate">{node.name}</span>
      </button>
      {node.expanded && node.children?.map((child) => (
        <TreeItem key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} onToggle={onToggle} />
      ))}
    </>
  );
};

// ── Toolbar Button ─────────────────────────────────────
const ToolBtn = ({ icon: Icon, label, onClick, disabled, variant = "ghost", destructive }: {
  icon: any; label: string; onClick: () => void; disabled?: boolean;
  variant?: "ghost" | "default"; destructive?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex flex-col items-center gap-0.5 px-2 py-1 rounded text-[10px] transition-colors min-w-[48px]",
      disabled && "opacity-40 pointer-events-none",
      destructive ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-accent/60",
    )}
  >
    <Icon className="h-4 w-4" />
    <span className="leading-tight">{label}</span>
  </button>
);

// ── Nav Button ─────────────────────────────────────────
const NavBtn = ({ icon: Icon, label, onClick, disabled }: {
  icon: any; label: string; onClick: () => void; disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex items-center gap-1 px-2 py-1 rounded text-[11px] text-primary hover:bg-primary/10 transition-colors",
      disabled && "opacity-40 pointer-events-none"
    )}
  >
    <Icon className="h-3.5 w-3.5" />
    <span>{label}</span>
  </button>
);

// ══════════════════════════════════════════════════════
// ██  MAIN FILE MANAGER COMPONENT
// ══════════════════════════════════════════════════════
const FileManager = () => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [contentItems, setContentItems] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [navHistory, setNavHistory] = useState<TreeNode[]>([]);
  const [navIndex, setNavIndex] = useState(-1);
  const [clipboard, setClipboard] = useState<{ nodes: TreeNode[]; action: "copy" | "cut" } | null>(null);

  // Dialogs
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<TreeNode | null>(null);
  const [renameName, setRenameName] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TreeNode | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDest, setMoveDest] = useState("");
  const [highlightedItem, setHighlightedItem] = useState<TreeNode | null>(null);

  const projectRoot = useMemo(() => buildProjectTree(), []);

  // ── Tree update helper ────
  const updateNodeInTree = useCallback((nodes: TreeNode[], path: string, updater: (n: TreeNode) => TreeNode): TreeNode[] => {
    return nodes.map((n) => {
      if (n.path === path) return updater(n);
      if (n.children && path.startsWith(`${n.path}/`)) return { ...n, children: updateNodeInTree(n.children, path, updater) };
      return n;
    });
  }, []);

  // ── Storage helpers ────
  const getStorageBucket = (node: TreeNode): string | null => {
    if (node.source !== "storage") return null;
    if (node.type === "bucket") return node.bucketId || node.name;
    return node.path.split("/")[1] || null;
  };
  const getStoragePath = (node: TreeNode): string => node.type === "bucket" ? "" : node.path.split("/").slice(2).join("/");
  const getProjectDisplayPath = (node: TreeNode) => node.path.replace(`${PROJECT_ROOT_PATH}/`, "");

  // ── Load buckets ────
  const loadBuckets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      const storageNodes: TreeNode[] = (data || []).map((b: any) => ({
        name: b.name, path: `storage/${b.id}`, type: "bucket" as NodeType, source: "storage" as NodeSource,
        bucketId: b.id, loaded: false, expanded: false, children: [], isPublic: b.public, created_at: b.created_at,
      }));
      setTree([projectRoot, ...storageNodes]);
    } catch (e: any) {
      toast.error(`Bucket'lar yüklenemedi: ${e.message}`);
      setTree([projectRoot]);
    } finally { setLoading(false); }
  }, [projectRoot]);

  // ── Load storage children ────
  const loadStorageChildren = useCallback(async (node: TreeNode): Promise<TreeNode[]> => {
    const bucket = getStorageBucket(node);
    if (!bucket) return [];
    const path = getStoragePath(node);
    const { data, error } = await supabase.storage.from(bucket).list(path || "", { limit: 500, sortBy: { column: "name", order: "asc" } });
    if (error) { toast.error(`Dosyalar yüklenemedi: ${error.message}`); return []; }
    return (data || [])
      .filter((item) => item.name !== ".emptyFolderPlaceholder")
      .map((item) => {
        const isFolder = item.id === null;
        return {
          name: item.name, path: `${node.path}/${item.name}`, type: (isFolder ? "folder" : "file") as NodeType,
          source: "storage" as NodeSource, loaded: false, expanded: false, children: isFolder ? [] : undefined,
          metadata: item.metadata ? { size: item.metadata.size, mimetype: item.metadata.mimetype, lastModified: item.updated_at } : undefined,
          created_at: item.created_at,
        } as TreeNode;
      })
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, "tr") : a.type === "folder" ? -1 : 1));
  }, []);

  // ── Toggle tree ────
  const handleToggle = useCallback(async (node: TreeNode) => {
    if (node.type === "file") return;
    if (node.source === "project") {
      setTree((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, expanded: !n.expanded })));
      return;
    }
    if (!node.loaded) {
      const children = await loadStorageChildren(node);
      setTree((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, children, loaded: true, expanded: true })));
    } else {
      setTree((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, expanded: !n.expanded })));
    }
  }, [loadStorageChildren, updateNodeInTree]);

  // ── Select node ────
  const handleSelect = useCallback(async (node: TreeNode) => {
    setSelectedNode(node);
    setSelectedFiles(new Set());
    setSearchQuery("");
    if (node.type === "file") return;

    // Add to nav history
    setNavHistory((prev) => {
      const next = prev.slice(0, navIndex + 1);
      next.push(node);
      return next;
    });
    setNavIndex((prev) => prev + 1);

    if (node.source === "project") { setContentItems(node.children || []); return; }
    setContentLoading(true);
    const children = node.loaded && node.children ? node.children : await loadStorageChildren(node);
    setContentItems(children);
    setContentLoading(false);
    if (!node.loaded) {
      setTree((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, children, loaded: true, expanded: true })));
    }
  }, [loadStorageChildren, updateNodeInTree, navIndex]);

  // ── Navigation ────
  const goBack = () => {
    if (navIndex > 0) { setNavIndex(navIndex - 1); const n = navHistory[navIndex - 1]; setSelectedNode(n); setContentItems(n.children || []); }
  };
  const goForward = () => {
    if (navIndex < navHistory.length - 1) { setNavIndex(navIndex + 1); const n = navHistory[navIndex + 1]; setSelectedNode(n); setContentItems(n.children || []); }
  };
  const goUp = () => {
    if (!selectedNode) return;
    const parts = selectedNode.path.split("/");
    if (parts.length <= 1) return;
    parts.pop();
    const parentPath = parts.join("/");
    // Find parent node in tree
    const findNode = (nodes: TreeNode[], target: string): TreeNode | null => {
      for (const n of nodes) {
        if (n.path === target) return n;
        if (n.children) { const found = findNode(n.children, target); if (found) return found; }
      }
      return null;
    };
    const parent = findNode(tree, parentPath);
    if (parent) handleSelect(parent);
  };
  const goHome = () => handleSelect(projectRoot);

  const refresh = useCallback(async () => {
    await loadBuckets();
    if (selectedNode && selectedNode.type !== "file" && selectedNode.source === "storage") {
      const refreshed = await loadStorageChildren(selectedNode);
      setContentItems(refreshed);
    }
  }, [loadBuckets, loadStorageChildren, selectedNode]);

  useEffect(() => { loadBuckets(); }, [loadBuckets]);

  const isStorage = selectedNode?.source === "storage";
  const isStorageFolder = !!selectedNode && isStorage && selectedNode.type !== "file";
  const checkedStorageItems = contentItems.filter((c) => selectedFiles.has(c.path) && c.source === "storage");
  const hasSelection = selectedFiles.size > 0;

  // Effective selection: checkbox items take priority, fallback to highlighted item
  const effectiveItems: TreeNode[] = checkedStorageItems.length > 0
    ? checkedStorageItems
    : (highlightedItem?.source === "storage" ? [highlightedItem] : []);

  const effectiveFiles = effectiveItems.filter((i) => i.type === "file");
  const hasEffective = effectiveItems.length > 0;

  // Resolve the "active" file for edit/view
  const activeFile = effectiveFiles.length === 1 ? effectiveFiles[0] : null;

  // ═══════════ OPERATIONS ═══════════

  // Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isStorageFolder || !selectedNode) return;
    const bucket = getStorageBucket(selectedNode);
    if (!bucket) return;
    const files = e.target.files;
    if (!files?.length) return;
    const parentPath = getStoragePath(selectedNode);
    setUploading(true);
    let count = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = parentPath ? `${parentPath}/${file.name}` : file.name;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (error) toast.error(`${file.name}: ${error.message}`); else count += 1;
    }
    if (count > 0) toast.success(`${count} dosya yüklendi`);
    setUploading(false);
    e.target.value = "";
    refresh();
  };

  // New folder
  const handleCreateFolder = async () => {
    if (!isStorageFolder || !selectedNode || !newFolderName.trim()) return;
    const bucket = getStorageBucket(selectedNode);
    if (!bucket) return;
    const parentPath = getStoragePath(selectedNode);
    const folderPath = parentPath ? `${parentPath}/${newFolderName.trim()}/.emptyFolderPlaceholder` : `${newFolderName.trim()}/.emptyFolderPlaceholder`;
    const { error } = await supabase.storage.from(bucket).upload(folderPath, new Blob([""]), { upsert: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Klasör oluşturuldu");
    setNewFolderOpen(false); setNewFolderName(""); refresh();
  };

  // New file
  const handleCreateFile = async () => {
    if (!isStorageFolder || !selectedNode || !newFileName.trim()) return;
    const bucket = getStorageBucket(selectedNode);
    if (!bucket) return;
    const parentPath = getStoragePath(selectedNode);
    const filePath = parentPath ? `${parentPath}/${newFileName.trim()}` : newFileName.trim();
    const { error } = await supabase.storage.from(bucket).upload(filePath, new Blob([""]), { upsert: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Dosya oluşturuldu");
    setNewFileOpen(false); setNewFileName(""); refresh();
  };

  // Delete
  const handleDeleteNodes = async (nodes: TreeNode[]) => {
    const storageNodes = nodes.filter((n) => n.source === "storage");
    if (!storageNodes.length) { toast.error("Sadece Storage dosyaları silinebilir"); return; }
    for (const node of storageNodes) {
      const bucket = getStorageBucket(node);
      if (!bucket) continue;
      const path = getStoragePath(node);
      if (node.type === "folder") {
        const { data } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
        if (data?.length) await supabase.storage.from(bucket).remove(data.map((f) => `${path}/${f.name}`));
        await supabase.storage.from(bucket).remove([`${path}/.emptyFolderPlaceholder`]);
      } else {
        await supabase.storage.from(bucket).remove([path]);
      }
    }
    toast.success(`${storageNodes.length} öğe silindi`);
    setSelectedFiles(new Set());
    refresh();
  };

  // Rename
  const handleRename = async () => {
    if (!renameTarget || renameTarget.source !== "storage" || !renameName.trim() || renameName === renameTarget.name) { setRenameOpen(false); return; }
    const bucket = getStorageBucket(renameTarget);
    if (!bucket) return;
    const oldPath = getStoragePath(renameTarget);
    const parts = oldPath.split("/");
    parts[parts.length - 1] = renameName.trim();
    const newPath = parts.join("/");
    const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(oldPath);
    if (downloadError) { toast.error(downloadError.message); return; }
    const { error: uploadError } = await supabase.storage.from(bucket).upload(newPath, blob, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); return; }
    await supabase.storage.from(bucket).remove([oldPath]);
    toast.success("Yeniden adlandırıldı");
    setRenameOpen(false); refresh();
  };

  // Copy / Cut to clipboard
  const handleCopy = () => {
    if (effectiveItems.length === 0) return;
    setClipboard({ nodes: effectiveItems, action: "copy" });
    toast.success(`${effectiveItems.length} öğe kopyalandı`);
  };
  const handleCut = () => {
    if (effectiveItems.length === 0) return;
    setClipboard({ nodes: effectiveItems, action: "cut" });
    toast.success(`${effectiveItems.length} öğe kesildi`);
  };

  // Paste
  const handlePaste = async () => {
    if (!clipboard || !isStorageFolder || !selectedNode) return;
    const destBucket = getStorageBucket(selectedNode);
    if (!destBucket) return;
    const destPath = getStoragePath(selectedNode);

    for (const node of clipboard.nodes) {
      const srcBucket = getStorageBucket(node);
      if (!srcBucket) continue;
      const srcPath = getStoragePath(node);
      const newPath = destPath ? `${destPath}/${node.name}` : node.name;

      if (srcBucket === destBucket) {
        const { error } = await supabase.storage.from(srcBucket).copy(srcPath, newPath);
        if (error) { toast.error(`${node.name}: ${error.message}`); continue; }
      } else {
        const { data: blob, error: dlErr } = await supabase.storage.from(srcBucket).download(srcPath);
        if (dlErr) { toast.error(`${node.name}: ${dlErr.message}`); continue; }
        const { error: ulErr } = await supabase.storage.from(destBucket).upload(newPath, blob, { upsert: true });
        if (ulErr) { toast.error(`${node.name}: ${ulErr.message}`); continue; }
      }

      if (clipboard.action === "cut") {
        await supabase.storage.from(srcBucket).remove([srcPath]);
      }
    }

    toast.success(`${clipboard.nodes.length} öğe yapıştırıldı`);
    setClipboard(null);
    setSelectedFiles(new Set());
    refresh();
  };

  // Move
  const handleMove = async () => {
    if (!moveDest.trim() || effectiveItems.length === 0) { setMoveOpen(false); return; }
    for (const node of effectiveItems) {
      const bucket = getStorageBucket(node);
      if (!bucket) continue;
      const srcPath = getStoragePath(node);
      const newPath = moveDest.trim().endsWith("/") ? `${moveDest.trim()}${node.name}` : `${moveDest.trim()}/${node.name}`;
      const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(srcPath);
      if (dlErr) { toast.error(`${node.name}: ${dlErr.message}`); continue; }
      const { error: ulErr } = await supabase.storage.from(bucket).upload(newPath, blob, { upsert: true });
      if (ulErr) { toast.error(`${node.name}: ${ulErr.message}`); continue; }
      await supabase.storage.from(bucket).remove([srcPath]);
    }
    toast.success("Dosyalar taşındı");
    setMoveOpen(false); setMoveDest(""); setSelectedFiles(new Set()); refresh();
  };

  // Edit
  const openEditor = async (node: TreeNode) => {
    if (node.source !== "storage") { toast.info("Web dosyaları salt okunurdur"); return; }
    const bucket = getStorageBucket(node);
    if (!bucket) return;
    setEditTarget(node); setEditLoading(true); setEditOpen(true);
    const { data, error } = await supabase.storage.from(bucket).download(getStoragePath(node));
    if (error) { toast.error(error.message); setEditOpen(false); return; }
    setEditContent(await data.text()); setEditLoading(false);
  };
  const saveEdit = async () => {
    if (!editTarget || editTarget.source !== "storage") return;
    const bucket = getStorageBucket(editTarget);
    if (!bucket) return;
    const { error } = await supabase.storage.from(bucket).upload(getStoragePath(editTarget), new Blob([editContent]), { upsert: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Dosya kaydedildi"); setEditOpen(false); refresh();
  };

  // Preview
  const openPreview = (node: TreeNode) => {
    if (node.source !== "storage") return;
    const bucket = getStorageBucket(node);
    if (!bucket) return;
    const { data } = supabase.storage.from(bucket).getPublicUrl(getStoragePath(node));
    setPreviewUrl(data.publicUrl); setPreviewName(node.name); setPreviewOpen(true);
  };

  // Download
  const handleDownload = (node: TreeNode) => {
    if (node.source !== "storage") return;
    const bucket = getStorageBucket(node);
    if (!bucket) return;
    const { data } = supabase.storage.from(bucket).getPublicUrl(getStoragePath(node));
    const a = document.createElement("a"); a.href = data.publicUrl; a.download = node.name; a.target = "_blank"; a.click();
  };

  const handleCopyUrl = (node: TreeNode) => {
    if (node.source === "storage") {
      const bucket = getStorageBucket(node);
      if (!bucket) return;
      const { data } = supabase.storage.from(bucket).getPublicUrl(getStoragePath(node));
      navigator.clipboard.writeText(data.publicUrl);
    } else {
      navigator.clipboard.writeText(getProjectDisplayPath(node));
    }
    toast.success("Kopyalandı");
  };

  const selectAll = () => {
    const storageFiles = filteredContent.filter((c) => c.source === "storage");
    setSelectedFiles(new Set(storageFiles.map((f) => f.path)));
  };
  const deselectAll = () => setSelectedFiles(new Set());

  const toggleSelect = (path: string) => {
    setSelectedFiles((prev) => { const next = new Set(prev); next.has(path) ? next.delete(path) : next.add(path); return next; });
  };

  const filteredContent = contentItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const breadcrumbs = selectedNode?.path.split("/") || [];

  const openRenameFor = (node: TreeNode) => { setRenameTarget(node); setRenameName(node.name); setRenameOpen(true); };

  // ═══════════ RENDER ═══════════
  return (
    <Card className="flex h-full overflow-hidden border-border">
      {/* ── LEFT: Tree ── */}
      <div className="w-52 lg:w-60 border-r border-border flex flex-col bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 p-2 border-b border-border bg-muted/40">
          <HardDrive className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">Dosya Yöneticisi</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {tree.map((node) => (
            <TreeItem key={node.path} node={node} depth={0} selectedPath={selectedNode?.path || ""} onSelect={handleSelect} onToggle={handleToggle} />
          ))}
        </div>
      </div>

      {/* ── RIGHT: Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ═══ PRIMARY TOOLBAR ═══ */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 border-b border-border bg-muted/30 overflow-x-auto">
          <ToolBtn icon={FilePlus} label="Dosya" onClick={() => { setNewFileOpen(true); setNewFileName(""); }} disabled={!isStorageFolder} />
          <ToolBtn icon={FolderPlus} label="Klasör" onClick={() => { setNewFolderOpen(true); setNewFolderName(""); }} disabled={!isStorageFolder} />
          <Separator orientation="vertical" className="h-8 mx-0.5" />
          <ToolBtn icon={Copy} label="Kopyala" onClick={handleCopy} disabled={!hasEffective} />
          <ToolBtn icon={Scissors} label="Kes" onClick={handleCut} disabled={!hasEffective} />
          <ToolBtn icon={Move} label="Yapıştır" onClick={handlePaste} disabled={!clipboard || !isStorageFolder} />
          <ToolBtn icon={Move} label="Taşı" onClick={() => { setMoveOpen(true); setMoveDest(""); }} disabled={!hasEffective} />
          <Separator orientation="vertical" className="h-8 mx-0.5" />
          <label className="cursor-pointer">
            <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" />
            <ToolBtn icon={Upload} label={uploading ? "..." : "Yükle"} onClick={() => fileInputRef.current?.click()} disabled={!isStorageFolder || uploading} />
          </label>
          <ToolBtn icon={Download} label="İndir" onClick={() => effectiveFiles.forEach(handleDownload)} disabled={effectiveFiles.length === 0} />
          <Separator orientation="vertical" className="h-8 mx-0.5" />
          <ToolBtn icon={Trash2} label="Sil" onClick={() => handleDeleteNodes(effectiveItems)} disabled={!hasEffective} destructive />
          <ToolBtn icon={Edit3} label="Adlandır" onClick={() => effectiveItems.length === 1 && openRenameFor(effectiveItems[0])} disabled={effectiveItems.length !== 1} />
          <ToolBtn icon={Edit3} label="Düzenle" onClick={() => activeFile && isEditable(activeFile.name) && openEditor(activeFile)} disabled={!activeFile || !isEditable(activeFile?.name || "")} />
          <ToolBtn icon={Eye} label="Görüntüle" onClick={() => activeFile && isPreviewable(activeFile.name) && openPreview(activeFile)} disabled={!activeFile || !isPreviewable(activeFile?.name || "")} />

          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Ara</span>
            <div className="relative w-36">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-6 pl-6 text-[11px]" placeholder="Dosya ara..." />
            </div>
          </div>
        </div>

        {/* ═══ SECONDARY NAV BAR ═══ */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-background overflow-x-auto">
          <NavBtn icon={Home} label="Ana Sayfa" onClick={goHome} />
          <NavBtn icon={ArrowUp} label="Yukarı" onClick={goUp} disabled={!selectedNode || selectedNode.path.split("/").length <= 1} />
          <NavBtn icon={ArrowLeft} label="Geri" onClick={goBack} disabled={navIndex <= 0} />
          <NavBtn icon={ArrowRight} label="İleri" onClick={goForward} disabled={navIndex >= navHistory.length - 1} />
          <NavBtn icon={RefreshCw} label="Yenile" onClick={refresh} disabled={loading || contentLoading} />
          <Separator orientation="vertical" className="h-5 mx-1" />
          <NavBtn icon={CheckSquare} label="Tümünü Seç" onClick={selectAll} />
          <NavBtn icon={XSquare} label="Seçimi Kaldır" onClick={deselectAll} disabled={!hasSelection} />
          {clipboard && (
            <span className="text-[10px] text-primary ml-2">
              📋 {clipboard.nodes.length} öğe ({clipboard.action === "copy" ? "kopyalandı" : "kesildi"})
            </span>
          )}
        </div>

        {/* ═══ TABLE ═══ */}
        <div className="flex-1 overflow-y-auto">
          {!selectedNode ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
              <FolderOpen className="h-10 w-10 opacity-20" />
              <p className="text-sm">Sol panelden klasör seçin</p>
            </div>
          ) : contentLoading ? (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : filteredContent.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Bu klasör boş</div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground sticky top-0 bg-background z-10 text-left">
                  <th className="w-7 p-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={filteredContent.filter((f) => f.source === "storage").length > 0 && selectedFiles.size === filteredContent.filter((f) => f.source === "storage").length}
                      onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                      className="rounded"
                    />
                  </th>
                  <th className="p-1.5 font-semibold text-primary cursor-pointer">Ad</th>
                  <th className="p-1.5 font-semibold w-20 hidden sm:table-cell">Boyut</th>
                  <th className="p-1.5 font-semibold w-36 hidden lg:table-cell">Son Değişiklik</th>
                  <th className="p-1.5 font-semibold w-32 hidden md:table-cell">Tür</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item) => {
                  const Icon = item.type === "folder" ? Folder : getFileIcon(item.name);
                  const isChecked = selectedFiles.has(item.path);
                  const isStorageItem = item.source === "storage";

                  return (
                    <tr
                      key={item.path}
                      className={cn(
                        "border-b border-border/30 hover:bg-accent/40 group cursor-default",
                        isChecked && "bg-primary/5",
                        highlightedItem?.path === item.path && !isChecked && "bg-accent/60"
                      )}
                      onClick={() => {
                        if (item.type === "file" && isStorageItem) setHighlightedItem(item);
                        else setHighlightedItem(null);
                      }}
                      onDoubleClick={() => {
                        if (item.type !== "file") { handleToggle(item); handleSelect(item); }
                        else if (isStorageItem && isEditable(item.name)) openEditor(item);
                        else if (isStorageItem && isPreviewable(item.name)) openPreview(item);
                      }}
                    >
                      <td className="p-1.5 text-center">
                        {isStorageItem && (
                          <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(item.path)} className="rounded" />
                        )}
                      </td>
                      <td className="p-1.5">
                        <button
                          onClick={() => {
                            if (item.type !== "file") handleSelect(item);
                            else if (isStorageItem) toggleSelect(item.path);
                          }}
                          className="flex items-center gap-2 text-left w-full"
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", item.type !== "file" ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("truncate", item.type !== "file" && "font-medium text-foreground")}>{item.name}</span>
                        </button>
                      </td>
                      <td className="p-1.5 text-muted-foreground hidden sm:table-cell">
                        {item.type === "file" ? formatSize(item.metadata?.size) : "-"}
                      </td>
                      <td className="p-1.5 text-muted-foreground hidden lg:table-cell">
                        {formatDate(item.metadata?.lastModified || item.created_at)}
                      </td>
                      <td className="p-1.5 text-muted-foreground hidden md:table-cell">
                        {item.type === "folder" ? "httpd/unix-directory" : getFileType(item.name)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ═══ STATUS BAR ═══ */}
        <div className="flex items-center justify-between px-3 py-1 text-[10px] text-muted-foreground border-t border-border bg-muted/10">
          <span>
            {filteredContent.filter((c) => c.type !== "file").length} klasör, {filteredContent.filter((c) => c.type === "file").length} dosya
            {selectedFiles.size > 0 && ` • ${selectedFiles.size} seçili`}
          </span>
          {selectedNode && (
            <span className="truncate ml-2">
              /{selectedNode.source === "project" ? getProjectDisplayPath(selectedNode) : selectedNode.path}
            </span>
          )}
        </div>
      </div>

      {/* ═══ DIALOGS ═══ */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Yeni Klasör Oluştur</DialogTitle></DialogHeader>
          <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Klasör adı" onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewFolderOpen(false)}>İptal</Button>
            <Button size="sm" onClick={handleCreateFolder}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newFileOpen} onOpenChange={setNewFileOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Yeni Dosya Oluştur</DialogTitle></DialogHeader>
          <Input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="dosya.txt" onKeyDown={(e) => e.key === "Enter" && handleCreateFile()} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewFileOpen(false)}>İptal</Button>
            <Button size="sm" onClick={handleCreateFile}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Yeniden Adlandır</DialogTitle></DialogHeader>
          <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename()} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenameOpen(false)}>İptal</Button>
            <Button size="sm" onClick={handleRename}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Dosyaları Taşı</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">{selectedStorageItems.length} öğe taşınacak. Hedef yol girin:</p>
          <Input value={moveDest} onChange={(e) => setMoveDest(e.target.value)} placeholder="hedef/klasor/yolu" onKeyDown={(e) => e.key === "Enter" && handleMove()} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMoveOpen(false)}>İptal</Button>
            <Button size="sm" onClick={handleMove}>Taşı</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <FileCode className="h-4 w-4" /> {editTarget?.name}
            </DialogTitle>
          </DialogHeader>
          {editLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Yükleniyor...</div>
          ) : (
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="flex-1 font-mono text-xs resize-none" />
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>İptal</Button>
            <Button size="sm" onClick={saveEdit}><Save className="h-3.5 w-3.5 mr-1" />Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="text-sm">{previewName}</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
            {previewName.toLowerCase().endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[60vh]" title={previewName} />
            ) : (
              <img src={previewUrl} alt={previewName} className="max-w-full max-h-[60vh] object-contain rounded" loading="lazy" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FileManager;
