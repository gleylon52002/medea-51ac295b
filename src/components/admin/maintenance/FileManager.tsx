import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  FolderPlus,
  Upload,
  Trash2,
  Edit3,
  Download,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Search,
  MoreVertical,
  FileText,
  FileImage,
  FileArchive,
  FileCode,
  Eye,
  Copy,
  HardDrive,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { projectFilePaths } from "@/data/projectFilePaths";

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
  metadata?: { size?: number; mimetype?: string };
  isPublic?: boolean;
}

const PROJECT_ROOT_PATH = "project";

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

const buildProjectTree = (): TreeNode => {
  const root: TreeNode = {
    name: "Web Dosyaları",
    path: PROJECT_ROOT_PATH,
    type: "folder",
    source: "project",
    expanded: true,
    loaded: true,
    children: [],
  };

  const ensureFolder = (parent: TreeNode, folderName: string, fullPath: string): TreeNode => {
    parent.children ||= [];
    let folder = parent.children.find((c) => c.type === "folder" && c.name === folderName && c.source === "project");
    if (!folder) {
      folder = {
        name: folderName,
        path: fullPath,
        type: "folder",
        source: "project",
        expanded: false,
        loaded: true,
        children: [],
      };
      parent.children.push(folder);
      parent.children.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name, "tr");
        return a.type === "folder" ? -1 : 1;
      });
    }
    return folder;
  };

  for (const rawPath of projectFilePaths) {
    const parts = rawPath.split("/");
    let current = root;

    parts.forEach((part, index) => {
      const currentPath = `${PROJECT_ROOT_PATH}/${parts.slice(0, index + 1).join("/")}`;
      const isLast = index === parts.length - 1;

      if (isLast) {
        current.children ||= [];
        current.children.push({
          name: part,
          path: currentPath,
          type: "file",
          source: "project",
          loaded: true,
        });
        current.children.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name, "tr");
          return a.type === "folder" ? -1 : 1;
        });
      } else {
        current = ensureFolder(current, part, currentPath);
      }
    });
  }

  return root;
};

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
  const isFolder = node.type !== "file";
  const icon = node.type === "bucket" ? HardDrive : node.type === "folder" ? (node.expanded ? FolderOpen : Folder) : getFileIcon(node.name);
  const Icon = icon;

  return (
    <>
      <button
        onClick={() => {
          if (isFolder) onToggle(node);
          onSelect(node);
        }}
        className={cn(
          "w-full flex items-center gap-1.5 py-1 px-2 text-xs text-left hover:bg-accent/50 transition-colors",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {isFolder ? (
          <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
            {node.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <Icon className={cn("h-3.5 w-3.5 shrink-0", isFolder ? "text-primary" : "text-muted-foreground")} />
        <span className="truncate">{node.name}</span>
        {node.type === "bucket" && node.isPublic !== undefined && (
          <span className="ml-auto text-[9px] text-muted-foreground">{node.isPublic ? "public" : "private"}</span>
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

const FileManager = () => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [contentItems, setContentItems] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const projectRoot = useMemo(() => buildProjectTree(), []);

  const updateNodeInTree = useCallback((nodes: TreeNode[], path: string, updater: (node: TreeNode) => TreeNode): TreeNode[] => {
    return nodes.map((n) => {
      if (n.path === path) return updater(n);
      if (n.children && path.startsWith(`${n.path}/`)) {
        return { ...n, children: updateNodeInTree(n.children, path, updater) };
      }
      return n;
    });
  }, []);

  const getStorageBucket = (node: TreeNode): string | null => {
    if (node.source !== "storage") return null;
    if (node.type === "bucket") return node.bucketId || node.name;
    const parts = node.path.split("/");
    return parts[1] || null;
  };

  const getStoragePath = (node: TreeNode): string => {
    if (node.type === "bucket") return "";
    return node.path.split("/").slice(2).join("/");
  };

  const getProjectDisplayPath = (node: TreeNode) => node.path.replace(`${PROJECT_ROOT_PATH}/`, "");

  const loadBuckets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;

      const storageNodes: TreeNode[] = (data || []).map((bucket: any) => ({
        name: bucket.name,
        path: `storage/${bucket.id}`,
        type: "bucket",
        source: "storage",
        bucketId: bucket.id,
        loaded: false,
        expanded: false,
        children: [],
        isPublic: bucket.public,
      }));

      setTree([projectRoot, ...storageNodes]);
    } catch (e: any) {
      toast.error(`Bucket'lar yüklenemedi: ${e.message}`);
      setTree([projectRoot]);
    } finally {
      setLoading(false);
    }
  }, [projectRoot]);

  const loadStorageChildren = useCallback(async (node: TreeNode): Promise<TreeNode[]> => {
    const bucket = getStorageBucket(node);
    if (!bucket) return [];

    const path = getStoragePath(node);
    const { data, error } = await supabase.storage.from(bucket).list(path || "", {
      limit: 500,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      toast.error(`Dosyalar yüklenemedi: ${error.message}`);
      return [];
    }

    return (data || [])
      .filter((item) => item.name !== ".emptyFolderPlaceholder")
      .map((item) => {
        const isFolder = item.id === null;
        const childPath = `${node.path}/${item.name}`;
        return {
          name: item.name,
          path: childPath,
          type: (isFolder ? "folder" : "file") as NodeType,
          source: "storage" as const,
          loaded: false,
          expanded: false,
          children: isFolder ? [] : undefined,
          metadata: item.metadata ? { size: item.metadata.size, mimetype: item.metadata.mimetype } : undefined,
        } as TreeNode;
      })
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name, "tr");
        return a.type === "folder" ? -1 : 1;
      });
  }, []);

  const handleToggle = useCallback(async (node: TreeNode) => {
    if (node.type === "file") return;

    if (node.source === "project") {
      setTree((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, expanded: !n.expanded })));
      return;
    }

    if (!node.loaded) {
      const children = await loadStorageChildren(node);
      setTree((prev) =>
        updateNodeInTree(prev, node.path, (n) => ({ ...n, children, loaded: true, expanded: true }))
      );
      return;
    }

    setTree((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, expanded: !n.expanded })));
  }, [loadStorageChildren, updateNodeInTree]);

  const handleSelect = useCallback(async (node: TreeNode) => {
    setSelectedNode(node);
    setSelectedFiles(new Set());

    if (node.type === "file") return;

    if (node.source === "project") {
      setContentItems(node.children || []);
      return;
    }

    setContentLoading(true);
    const children = node.loaded && node.children ? node.children : await loadStorageChildren(node);
    setContentItems(children);
    setContentLoading(false);

    if (!node.loaded) {
      setTree((prev) =>
        updateNodeInTree(prev, node.path, (n) => ({ ...n, children, loaded: true, expanded: true }))
      );
    }
  }, [loadStorageChildren, updateNodeInTree]);

  const refresh = useCallback(async () => {
    await loadBuckets();

    if (selectedNode && selectedNode.type !== "file") {
      const refreshed = selectedNode.source === "project"
        ? selectedNode.children || []
        : await loadStorageChildren(selectedNode);
      setContentItems(refreshed);
    }
  }, [loadBuckets, loadStorageChildren, selectedNode]);

  useEffect(() => {
    loadBuckets();
  }, [loadBuckets]);

  const isStorageFolderSelected = !!selectedNode && selectedNode.source === "storage" && selectedNode.type !== "file";
  const isProjectSelected = selectedNode?.source === "project";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isStorageFolderSelected || !selectedNode) return;

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
      if (error) toast.error(`${file.name}: ${error.message}`);
      else count += 1;
    }

    if (count > 0) toast.success(`${count} dosya yüklendi`);
    setUploading(false);
    e.target.value = "";
    refresh();
  };

  const handleCreateFolder = async () => {
    if (!isStorageFolderSelected || !selectedNode || !newFolderName.trim()) return;

    const bucket = getStorageBucket(selectedNode);
    if (!bucket) return;

    const parentPath = getStoragePath(selectedNode);
    const folderPath = parentPath
      ? `${parentPath}/${newFolderName.trim()}/.emptyFolderPlaceholder`
      : `${newFolderName.trim()}/.emptyFolderPlaceholder`;

    const { error } = await supabase.storage.from(bucket).upload(folderPath, new Blob([""]), { upsert: true });
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Klasör oluşturuldu");
    setNewFolderOpen(false);
    setNewFolderName("");
    refresh();
  };

  const handleDeleteNodes = async (nodes: TreeNode[]) => {
    const storageNodes = nodes.filter((n) => n.source === "storage");
    if (!storageNodes.length) return;

    for (const node of storageNodes) {
      const bucket = getStorageBucket(node);
      if (!bucket) continue;

      const path = getStoragePath(node);
      if (node.type === "folder") {
        const { data } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
        if (data?.length) {
          await supabase.storage.from(bucket).remove(data.map((f) => `${path}/${f.name}`));
        }
        await supabase.storage.from(bucket).remove([`${path}/.emptyFolderPlaceholder`]);
      } else {
        await supabase.storage.from(bucket).remove([path]);
      }
    }

    toast.success(`${storageNodes.length} öğe silindi`);
    setSelectedFiles(new Set());
    refresh();
  };

  const handleRename = async () => {
    if (!renameTarget || renameTarget.source !== "storage" || !renameName.trim() || renameName === renameTarget.name) {
      setRenameOpen(false);
      return;
    }

    const bucket = getStorageBucket(renameTarget);
    if (!bucket) return;

    const oldPath = getStoragePath(renameTarget);
    const newPath = `${oldPath.split("/").slice(0, -1).join("/")}${oldPath.includes("/") ? "/" : ""}${renameName.trim()}`;

    const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(oldPath);
    if (downloadError) {
      toast.error(downloadError.message);
      return;
    }

    const { error: uploadError } = await supabase.storage.from(bucket).upload(newPath, blob, { upsert: true });
    if (uploadError) {
      toast.error(uploadError.message);
      return;
    }

    await supabase.storage.from(bucket).remove([oldPath]);
    toast.success("Dosya yeniden adlandırıldı");
    setRenameOpen(false);
    refresh();
  };

  const openEditor = async (node: TreeNode) => {
    if (node.source !== "storage") {
      toast.info("Web dosyaları burada salt okunur, düzenleme editörden yapılır.");
      return;
    }

    const bucket = getStorageBucket(node);
    if (!bucket) return;

    setEditTarget(node);
    setEditLoading(true);
    setEditOpen(true);

    const { data, error } = await supabase.storage.from(bucket).download(getStoragePath(node));
    if (error) {
      toast.error(error.message);
      setEditOpen(false);
      return;
    }

    setEditContent(await data.text());
    setEditLoading(false);
  };

  const saveEdit = async () => {
    if (!editTarget || editTarget.source !== "storage") return;

    const bucket = getStorageBucket(editTarget);
    if (!bucket) return;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(getStoragePath(editTarget), new Blob([editContent]), { upsert: true });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Dosya kaydedildi");
    setEditOpen(false);
    refresh();
  };

  const openPreview = (node: TreeNode) => {
    if (node.source !== "storage") {
      toast.info("Web dosyaları burada yalnızca listelenir.");
      return;
    }

    const bucket = getStorageBucket(node);
    if (!bucket) return;

    const { data } = supabase.storage.from(bucket).getPublicUrl(getStoragePath(node));
    setPreviewUrl(data.publicUrl);
    setPreviewName(node.name);
    setPreviewOpen(true);
  };

  const handleDownload = (node: TreeNode) => {
    if (node.source !== "storage") {
      toast.info("Web dosyaları için burada indirme yok, sadece yol görünümü var.");
      return;
    }

    const bucket = getStorageBucket(node);
    if (!bucket) return;

    const { data } = supabase.storage.from(bucket).getPublicUrl(getStoragePath(node));
    const a = document.createElement("a");
    a.href = data.publicUrl;
    a.download = node.name;
    a.target = "_blank";
    a.click();
  };

  const handleCopyPath = (node: TreeNode) => {
    const value = node.source === "project" ? getProjectDisplayPath(node) : `${getStorageBucket(node)}/${getStoragePath(node)}`;
    navigator.clipboard.writeText(value);
    toast.success("Yol kopyalandı");
  };

  const toggleSelect = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const filteredContent = contentItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStorageNodes = contentItems.filter((i) => selectedFiles.has(i.path) && i.source === "storage");
  const breadcrumbs = selectedNode?.path.split("/") || [];

  return (
    <Card className="flex h-full overflow-hidden border-border">
      <div className="w-56 lg:w-64 border-r border-border flex flex-col bg-muted/20 shrink-0">
        <div className="flex items-center gap-1 p-2 border-b border-border">
          <HardDrive className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Dosya Sistemi</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
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

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-border bg-muted/30">
          {isStorageFolderSelected && (
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
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setNewFolderOpen(true)}>
                <FolderPlus className="h-3.5 w-3.5 mr-1" />
                Yeni Klasör
              </Button>
            </>
          )}

          {selectedFiles.size > 0 && selectedStorageNodes.length > 0 && (
            <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => handleDeleteNodes(selectedStorageNodes)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Sil ({selectedStorageNodes.length})
            </Button>
          )}

          <div className="flex-1" />

          <div className="relative w-44">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-muted-foreground border-b border-border bg-muted/10 overflow-x-auto">
          {breadcrumbs.map((part, i) => (
            <span key={`${part}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-2.5 w-2.5" />}
              <span className={cn(i === breadcrumbs.length - 1 && "text-foreground")}>{part}</span>
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {!selectedNode ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
              <FolderOpen className="h-10 w-10 opacity-30" />
              <p className="text-sm">Sol panelden klasör seçin</p>
            </div>
          ) : contentLoading ? (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : filteredContent.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Bu klasör boş</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground sticky top-0 bg-background z-10">
                  <th className="w-8 p-1.5">
                    <input
                      type="checkbox"
                      checked={
                        filteredContent.filter((f) => f.type === "file" && f.source === "storage").length > 0 &&
                        selectedFiles.size === filteredContent.filter((f) => f.type === "file" && f.source === "storage").length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles(new Set(filteredContent.filter((f) => f.type === "file" && f.source === "storage").map((f) => f.path)));
                        } else {
                          setSelectedFiles(new Set());
                        }
                      }}
                      className="rounded"
                      disabled={isProjectSelected}
                    />
                  </th>
                  <th className="text-left p-1.5 font-medium">Ad</th>
                  <th className="text-left p-1.5 font-medium w-24 hidden sm:table-cell">Boyut</th>
                  <th className="text-left p-1.5 font-medium w-32 hidden md:table-cell">Kaynak</th>
                  <th className="w-10 p-1.5" />
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item) => {
                  const Icon = item.type === "folder" ? Folder : getFileIcon(item.name);
                  const isStorageFile = item.source === "storage" && item.type === "file";

                  return (
                    <tr key={item.path} className={cn("border-b border-border/30 hover:bg-accent/30 group", selectedFiles.has(item.path) && "bg-accent/20")}>
                      <td className="p-1.5">
                        {isStorageFile && (
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(item.path)}
                            onChange={() => toggleSelect(item.path)}
                            className="rounded"
                          />
                        )}
                      </td>

                      <td className="p-1.5">
                        <button
                          onDoubleClick={() => {
                            if (item.type !== "file") {
                              handleToggle(item);
                              handleSelect(item);
                            }
                          }}
                          onClick={() => item.type !== "file" && handleSelect(item)}
                          className="flex items-center gap-2 text-left w-full"
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", item.type !== "file" ? "text-primary" : "text-muted-foreground")} />
                          <span className="truncate">{item.name}</span>
                        </button>
                      </td>

                      <td className="p-1.5 text-muted-foreground hidden sm:table-cell">
                        {item.type === "file" && item.source === "storage" ? formatSize(item.metadata?.size) : "-"}
                      </td>

                      <td className="p-1.5 text-muted-foreground hidden md:table-cell">
                        {item.source === "project" ? "Web" : "Storage"}
                      </td>

                      <td className="p-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            {item.type === "file" && item.source === "storage" && isPreviewable(item.name) && (
                              <DropdownMenuItem onClick={() => openPreview(item)}>
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                Önizle
                              </DropdownMenuItem>
                            )}
                            {item.type === "file" && item.source === "storage" && isEditable(item.name) && (
                              <DropdownMenuItem onClick={() => openEditor(item)}>
                                <Edit3 className="h-3.5 w-3.5 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                            )}
                            {item.type === "file" && item.source === "storage" && (
                              <DropdownMenuItem onClick={() => handleDownload(item)}>
                                <Download className="h-3.5 w-3.5 mr-2" />
                                İndir
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleCopyPath(item)}>
                              <Copy className="h-3.5 w-3.5 mr-2" />
                              Yol Kopyala
                            </DropdownMenuItem>

                            {item.type === "file" && item.source === "storage" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRenameTarget(item);
                                    setRenameName(item.name);
                                    setRenameOpen(true);
                                  }}
                                >
                                  <Edit3 className="h-3.5 w-3.5 mr-2" />
                                  Yeniden Adlandır
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteNodes([item])}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Sil
                                </DropdownMenuItem>
                              </>
                            )}
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

        <div className="flex items-center justify-between px-3 py-1 text-[10px] text-muted-foreground border-t border-border bg-muted/10">
          <span>
            {filteredContent.filter((c) => c.type !== "file").length} klasör, {filteredContent.filter((c) => c.type === "file").length} dosya
          </span>
          {selectedNode && <span className="truncate ml-2">{selectedNode.source === "project" ? getProjectDisplayPath(selectedNode) : selectedNode.path}</span>}
        </div>
      </div>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Yeni Klasör</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Klasör adı"
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewFolderOpen(false)}>İptal</Button>
            <Button size="sm" onClick={handleCreateFolder}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Yeniden Adlandır</DialogTitle>
          </DialogHeader>
          <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename()} />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenameOpen(false)}>İptal</Button>
            <Button size="sm" onClick={handleRename}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="flex-1 font-mono text-xs resize-none" />
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>İptal</Button>
            <Button size="sm" onClick={saveEdit}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm">{previewName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
            {previewName.toLowerCase().endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[60vh]" />
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
