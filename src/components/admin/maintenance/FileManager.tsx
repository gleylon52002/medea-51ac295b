import { useState, useEffect, useCallback, useRef } from "react";
import {
  FolderPlus, Upload, Trash2, Edit3, Download, File, Folder, FolderOpen,
  ChevronRight, ChevronDown, Home, RefreshCw, Search, MoreVertical,
  FileText, FileImage, FileArchive, FileCode, Eye, Copy,
  HardDrive, ArrowLeft, X, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────
interface TreeNode {
  name: string;
  path: string;
  type: "bucket" | "folder" | "file";
  bucketId?: string;
  children?: TreeNode[];
  loaded?: boolean;
  expanded?: boolean;
  metadata?: { size?: number; mimetype?: string };
  isPublic?: boolean;
}

// ── Helpers ────────────────────────────────────────────
const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"].includes(ext)) return FileImage;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  if (["html", "css", "js", "ts", "tsx", "jsx", "json", "xml", "php", "py", "sql"].includes(ext)) return FileCode;
  if (["txt", "md", "csv", "log", "pdf", "doc", "docx"].includes(ext)) return FileText;
  return File;
};

const formatSize = (bytes?: number) => {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const isEditable = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["txt", "md", "html", "css", "js", "ts", "tsx", "jsx", "json", "xml", "csv", "log", "env", "yml", "yaml", "toml", "php", "py", "sql"].includes(ext);
};

const isPreviewable = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "pdf"].includes(ext);
};

// ── Tree Item Component ────────────────────────────────
const TreeItem = ({
  node,
  depth,
  selectedPath,
  onSelect,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string;
  onSelect: (node: TreeNode) => void;
  onToggle: (node: TreeNode) => void;
}) => {
  const isSelected = selectedPath === node.path;
  const isFolder = node.type === "bucket" || node.type === "folder";
  const hasChildren = node.children && node.children.length > 0;
  const IconComponent = node.type === "bucket"
    ? HardDrive
    : node.type === "folder"
      ? (node.expanded ? FolderOpen : Folder)
      : getFileIcon(node.name);

  const handleClick = () => {
    if (isFolder) {
      onToggle(node);
      onSelect(node);
    } else {
      onSelect(node);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-1.5 py-1 px-2 text-xs hover:bg-accent/50 transition-colors text-left",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isFolder ? (
          <span className="shrink-0 w-3.5 h-3.5 flex items-center justify-center">
            {node.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <IconComponent className={cn(
          "h-3.5 w-3.5 shrink-0",
          node.type === "bucket" ? "text-blue-500" : isFolder ? "text-amber-500" : "text-muted-foreground"
        )} />
        <span className="truncate">{node.name}</span>
        {node.type === "bucket" && node.isPublic !== undefined && (
          <span className={cn(
            "ml-auto text-[9px] px-1 rounded",
            node.isPublic ? "text-emerald-600" : "text-orange-500"
          )}>
            {node.isPublic ? "pub" : "prv"}
          </span>
        )}
      </button>
      {node.expanded && node.children?.map((child) => (
        <TreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </>
  );
};

// ── Main FileManager ───────────────────────────────────
const FileManager = () => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [contentItems, setContentItems] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialogs
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
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
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Get bucket ID from a node's path
  const getBucketFromNode = (node: TreeNode): string | undefined => {
    if (node.type === "bucket") return node.bucketId || node.name;
    // Walk up path: first segment is bucket
    const parts = node.path.split("/");
    return parts[0];
  };

  const getStoragePath = (node: TreeNode): string => {
    const parts = node.path.split("/");
    return parts.slice(1).join("/");
  };

  // Load all buckets as root tree nodes
  const loadBuckets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      const bucketNodes: TreeNode[] = (data || []).map((b: any) => ({
        name: b.name,
        path: b.id,
        type: "bucket" as const,
        bucketId: b.id,
        children: [],
        loaded: false,
        expanded: false,
        isPublic: b.public,
      }));
      setTree(bucketNodes);
    } catch (e: any) {
      toast.error("Bucket'lar yüklenemedi: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load children of a folder/bucket
  const loadChildren = useCallback(async (node: TreeNode): Promise<TreeNode[]> => {
    const bucket = getBucketFromNode(node);
    if (!bucket) return [];
    const storagePath = node.type === "bucket" ? "" : getStoragePath(node);

    const { data, error } = await supabase.storage.from(bucket).list(storagePath || "", {
      limit: 500,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      toast.error("Dosyalar yüklenemedi: " + error.message);
      return [];
    }

    const children: TreeNode[] = [];
    (data || []).forEach((item) => {
      if (item.name === ".emptyFolderPlaceholder") return;
      const childPath = node.path + "/" + item.name;
      const isFolder = item.id === null;
      children.push({
        name: item.name,
        path: childPath,
        type: isFolder ? "folder" : "file",
        children: isFolder ? [] : undefined,
        loaded: false,
        expanded: false,
        metadata: item.metadata ? { size: item.metadata.size, mimetype: item.metadata.mimetype } : undefined,
      });
    });
    return children;
  }, []);

  // Update tree node deeply
  const updateNodeInTree = (nodes: TreeNode[], path: string, updater: (n: TreeNode) => TreeNode): TreeNode[] => {
    return nodes.map((n) => {
      if (n.path === path) return updater(n);
      if (n.children && path.startsWith(n.path + "/")) {
        return { ...n, children: updateNodeInTree(n.children, path, updater) };
      }
      return n;
    });
  };

  // Toggle expand/collapse
  const handleToggle = useCallback(async (node: TreeNode) => {
    if (node.type === "file") return;

    if (!node.loaded) {
      const children = await loadChildren(node);
      setTree((prev) =>
        updateNodeInTree(prev, node.path, (n) => ({
          ...n,
          children,
          loaded: true,
          expanded: true,
        }))
      );
    } else {
      setTree((prev) =>
        updateNodeInTree(prev, node.path, (n) => ({
          ...n,
          expanded: !n.expanded,
        }))
      );
    }
  }, [loadChildren]);

  // Select a node → load content panel
  const handleSelect = useCallback(async (node: TreeNode) => {
    setSelectedNode(node);
    setSelectedFiles(new Set());
    setSearchQuery("");

    if (node.type === "file") {
      // For files, show parent's contents
      return;
    }

    setContentLoading(true);
    const children = node.loaded && node.children ? node.children : await loadChildren(node);
    setContentItems(children);
    setContentLoading(false);

    // Also update tree
    if (!node.loaded) {
      setTree((prev) =>
        updateNodeInTree(prev, node.path, (n) => ({
          ...n,
          children,
          loaded: true,
          expanded: true,
        }))
      );
    }
  }, [loadChildren]);

  useEffect(() => {
    loadBuckets();
  }, [loadBuckets]);

  // Refresh current view
  const refresh = async () => {
    if (!selectedNode) {
      loadBuckets();
      return;
    }
    const children = await loadChildren(selectedNode);
    setContentItems(children);
    setTree((prev) =>
      updateNodeInTree(prev, selectedNode.path, (n) => ({
        ...n,
        children,
        loaded: true,
      }))
    );
  };

  // Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedNode || selectedNode.type === "file") return;
    const bucket = getBucketFromNode(selectedNode);
    if (!bucket) return;
    const fileList = e.target.files;
    if (!fileList?.length) return;

    const storagePath = selectedNode.type === "bucket" ? "" : getStoragePath(selectedNode);
    setUploading(true);
    let ok = 0;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const path = storagePath ? `${storagePath}/${file.name}` : file.name;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) toast.error(`${file.name}: ${error.message}`);
      else ok++;
    }
    if (ok > 0) toast.success(`${ok} dosya yüklendi`);
    setUploading(false);
    e.target.value = "";
    refresh();
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!selectedNode || !newFolderName.trim()) return;
    const bucket = getBucketFromNode(selectedNode);
    if (!bucket) return;
    const storagePath = selectedNode.type === "bucket" ? "" : getStoragePath(selectedNode);
    const folderPath = storagePath ? `${storagePath}/${newFolderName.trim()}/.emptyFolderPlaceholder` : `${newFolderName.trim()}/.emptyFolderPlaceholder`;

    const { error } = await supabase.storage.from(bucket).upload(folderPath, new Blob([""]), { upsert: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Klasör oluşturuldu");
    setNewFolderOpen(false);
    setNewFolderName("");
    refresh();
  };

  // Delete files
  const handleDeleteFiles = async (nodes: TreeNode[]) => {
    for (const node of nodes) {
      const bucket = getBucketFromNode(node);
      if (!bucket) continue;
      const sp = getStoragePath(node);

      if (node.type === "folder") {
        const { data } = await supabase.storage.from(bucket).list(sp, { limit: 1000 });
        if (data?.length) {
          const paths = data.map((f) => `${sp}/${f.name}`);
          await supabase.storage.from(bucket).remove(paths);
        }
        await supabase.storage.from(bucket).remove([`${sp}/.emptyFolderPlaceholder`]);
      } else {
        await supabase.storage.from(bucket).remove([sp]);
      }
    }
    toast.success(`${nodes.length} öğe silindi`);
    setSelectedFiles(new Set());
    refresh();
  };

  // Rename
  const handleRename = async () => {
    if (!renameTarget || !renameName.trim() || renameName === renameTarget.name) { setRenameOpen(false); return; }
    const bucket = getBucketFromNode(renameTarget);
    if (!bucket) return;
    const oldPath = getStoragePath(renameTarget);
    const pathParts = oldPath.split("/");
    pathParts[pathParts.length - 1] = renameName.trim();
    const newPath = pathParts.join("/");

    const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(oldPath);
    if (dlErr) { toast.error(dlErr.message); return; }
    const { error: upErr } = await supabase.storage.from(bucket).upload(newPath, blob, { upsert: true });
    if (upErr) { toast.error(upErr.message); return; }
    await supabase.storage.from(bucket).remove([oldPath]);
    toast.success("Dosya yeniden adlandırıldı");
    setRenameOpen(false);
    refresh();
  };

  // Edit
  const openEditor = async (node: TreeNode) => {
    const bucket = getBucketFromNode(node);
    if (!bucket) return;
    setEditTarget(node);
    setEditLoading(true);
    setEditOpen(true);
    const sp = getStoragePath(node);
    const { data, error } = await supabase.storage.from(bucket).download(sp);
    if (error) { toast.error(error.message); setEditOpen(false); return; }
    const text = await data.text();
    setEditContent(text);
    setEditLoading(false);
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const bucket = getBucketFromNode(editTarget);
    if (!bucket) return;
    const sp = getStoragePath(editTarget);
    const { error } = await supabase.storage.from(bucket).upload(sp, new Blob([editContent]), { upsert: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Dosya kaydedildi");
    setEditOpen(false);
  };

  // Preview
  const openPreview = (node: TreeNode) => {
    const bucket = getBucketFromNode(node);
    if (!bucket) return;
    const sp = getStoragePath(node);
    const { data } = supabase.storage.from(bucket).getPublicUrl(sp);
    setPreviewUrl(data.publicUrl);
    setPreviewName(node.name);
    setPreviewOpen(true);
  };

  // Download
  const handleDownload = (node: TreeNode) => {
    const bucket = getBucketFromNode(node);
    if (!bucket) return;
    const sp = getStoragePath(node);
    const { data } = supabase.storage.from(bucket).getPublicUrl(sp);
    const a = document.createElement("a");
    a.href = data.publicUrl;
    a.download = node.name;
    a.target = "_blank";
    a.click();
  };

  // Copy URL
  const handleCopyUrl = (node: TreeNode) => {
    const bucket = getBucketFromNode(node);
    if (!bucket) return;
    const sp = getStoragePath(node);
    const { data } = supabase.storage.from(bucket).getPublicUrl(sp);
    navigator.clipboard.writeText(data.publicUrl);
    toast.success("URL kopyalandı");
  };

  const toggleSelect = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const currentBreadcrumbs = selectedNode ? selectedNode.path.split("/") : [];
  const filteredContent = contentItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const isFolderSelected = selectedNode && selectedNode.type !== "file";

  const selectedContentNodes = contentItems.filter((c) => selectedFiles.has(c.path));

  // Navigate content panel by double-clicking a folder
  const enterContentFolder = (node: TreeNode) => {
    handleToggle(node);
    handleSelect(node);
  };

  return (
    <Card className="flex h-full overflow-hidden border-border">
      {/* ── Left: Tree Sidebar ── */}
      <div className="w-56 lg:w-64 border-r border-border flex flex-col bg-muted/20 shrink-0">
        <div className="flex items-center gap-1 p-2 border-b border-border">
          <HardDrive className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Dosya Sistemi</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={loadBuckets} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {tree.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground text-center py-4">Bucket bulunamadı</p>
          )}
          {tree.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedNode?.path || ""}
              onSelect={handleSelect}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* ── Right: Content Panel ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-border bg-muted/30">
          {isFolderSelected && (
            <>
              <label className="cursor-pointer">
                <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" />
                <Button variant="default" size="sm" disabled={uploading} className="h-7 text-xs" asChild>
                  <span>
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    {uploading ? "Yükleniyor..." : "Yükle"}
                  </span>
                </Button>
              </label>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setNewFolderOpen(true); setNewFolderName(""); }}>
                <FolderPlus className="h-3.5 w-3.5 mr-1" />
                Yeni Klasör
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={refresh} disabled={loading || contentLoading}>
            <RefreshCw className={cn("h-3.5 w-3.5", (loading || contentLoading) && "animate-spin")} />
          </Button>
          {selectedFiles.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleDeleteFiles(selectedContentNodes)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Sil ({selectedFiles.size})
            </Button>
          )}

          <div className="flex-1" />
          <div className="relative w-40">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-muted-foreground border-b border-border overflow-x-auto bg-muted/10">
          <button onClick={() => { setSelectedNode(null); setContentItems([]); }} className="hover:text-foreground font-medium">
            /
          </button>
          {currentBreadcrumbs.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-2.5 w-2.5 shrink-0" />
              <span className={cn(
                "font-medium",
                i === currentBreadcrumbs.length - 1 ? "text-foreground" : "hover:text-foreground cursor-pointer"
              )}>
                {part}
              </span>
            </span>
          ))}
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {!selectedNode ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <FolderOpen className="h-12 w-12 opacity-20" />
              <p className="text-sm">Sol panelden bir klasör seçin</p>
            </div>
          ) : contentLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Yükleniyor...
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <File className="h-8 w-8 opacity-20" />
              <p>Bu klasör boş</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground sticky top-0 bg-background z-10">
                  <th className="w-8 p-1.5">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === filteredContent.filter(f => f.type === "file").length && selectedFiles.size > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles(new Set(filteredContent.filter(f => f.type === "file").map(f => f.path)));
                        } else {
                          setSelectedFiles(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-1.5 font-medium">Ad</th>
                  <th className="text-left p-1.5 font-medium w-20 hidden sm:table-cell">Boyut</th>
                  <th className="text-left p-1.5 font-medium w-28 hidden md:table-cell">Tür</th>
                  <th className="w-10 p-1.5" />
                </tr>
              </thead>
              <tbody>
                {/* Folders first */}
                {filteredContent.filter(c => c.type === "folder").map((item) => (
                  <tr
                    key={item.path}
                    className="border-b border-border/30 hover:bg-accent/30 group cursor-pointer"
                    onDoubleClick={() => enterContentFolder(item)}
                  >
                    <td className="p-1.5" />
                    <td className="p-1.5">
                      <button
                        onClick={() => enterContentFolder(item)}
                        className="flex items-center gap-2 text-foreground hover:text-primary"
                      >
                        <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="font-medium">{item.name}</span>
                      </button>
                    </td>
                    <td className="p-1.5 text-muted-foreground hidden sm:table-cell">-</td>
                    <td className="p-1.5 text-muted-foreground hidden md:table-cell">Klasör</td>
                    <td className="p-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={() => handleDeleteFiles([item])}>
                            <Trash2 className="h-3.5 w-3.5 mr-2 text-destructive" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {/* Then files */}
                {filteredContent.filter(c => c.type === "file").map((item) => {
                  const Icon = getFileIcon(item.name);
                  return (
                    <tr
                      key={item.path}
                      className={cn(
                        "border-b border-border/30 hover:bg-accent/30 group",
                        selectedFiles.has(item.path) && "bg-accent/20"
                      )}
                    >
                      <td className="p-1.5">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(item.path)}
                          onChange={() => toggleSelect(item.path)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-1.5 text-muted-foreground hidden sm:table-cell">
                        {formatSize(item.metadata?.size)}
                      </td>
                      <td className="p-1.5 text-muted-foreground hidden md:table-cell">
                        {item.metadata?.mimetype || item.name.split(".").pop()?.toUpperCase() || "-"}
                      </td>
                      <td className="p-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            {isPreviewable(item.name) && (
                              <DropdownMenuItem onClick={() => openPreview(item)}>
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                Önizle
                              </DropdownMenuItem>
                            )}
                            {isEditable(item.name) && (
                              <DropdownMenuItem onClick={() => openEditor(item)}>
                                <Edit3 className="h-3.5 w-3.5 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDownload(item)}>
                              <Download className="h-3.5 w-3.5 mr-2" />
                              İndir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyUrl(item)}>
                              <Copy className="h-3.5 w-3.5 mr-2" />
                              URL Kopyala
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setRenameTarget(item);
                              setRenameName(item.name);
                              setRenameOpen(true);
                            }}>
                              <Edit3 className="h-3.5 w-3.5 mr-2" />
                              Yeniden Adlandır
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteFiles([item])} className="text-destructive">
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 text-[10px] text-muted-foreground border-t border-border bg-muted/10">
          <span>
            {filteredContent.filter(c => c.type === "folder").length} klasör, {filteredContent.filter(c => c.type === "file").length} dosya
          </span>
          {selectedNode && (
            <span className="truncate ml-2">
              /{selectedNode.path}
            </span>
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}

      {/* New Folder */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Yeni Klasör</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Klasör adı"
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewFolderOpen(false)}>İptal</Button>
            <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Yeniden Adlandır</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenameOpen(false)}>İptal</Button>
            <Button size="sm" onClick={handleRename}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editor */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              {editTarget?.name}
            </DialogTitle>
          </DialogHeader>
          {editLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Yükleniyor...</div>
          ) : (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 font-mono text-xs resize-none"
            />
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>İptal</Button>
            <Button size="sm" onClick={saveEdit} disabled={editLoading}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm">{previewName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
            {previewName.toLowerCase().endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[60vh]" />
            ) : (
              <img src={previewUrl} alt={previewName} className="max-w-full max-h-[60vh] object-contain rounded" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FileManager;
