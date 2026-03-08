import { useState, useEffect, useCallback } from "react";
import {
  FolderPlus, Upload, Trash2, Edit3, Download, File, Folder,
  ChevronRight, Home, RefreshCw, Search, MoreVertical,
  FileText, FileImage, FileArchive, FileCode, Eye, Copy, Check, ArrowLeft,
  HardDrive, Database
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

interface StorageFile {
  name: string;
  id?: string;
  metadata?: { size?: number; mimetype?: string };
  created_at?: string;
  updated_at?: string;
}

interface StorageFolder {
  name: string;
}

interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  created_at?: string;
}

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"].includes(ext)) return FileImage;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  if (["html", "css", "js", "ts", "tsx", "jsx", "json", "xml", "php", "py"].includes(ext)) return FileCode;
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

const FileManager = () => {
  // null = bucket listing, string = inside a bucket
  const [currentBucket, setCurrentBucket] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);

  // Dialogs
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState("");
  const [renameName, setRenameName] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const fullPath = (name: string) => currentPath ? `${currentPath}/${name}` : name;

  // Load buckets
  const loadBuckets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      setBuckets((data || []) as BucketInfo[]);
    } catch (e: any) {
      toast.error("Bucket'lar yüklenemedi: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load files within a bucket
  const loadFiles = useCallback(async () => {
    if (!currentBucket) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(currentBucket).list(currentPath || "", {
        limit: 500,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;

      const folderItems: StorageFolder[] = [];
      const fileItems: StorageFile[] = [];

      (data || []).forEach((item) => {
        if (item.id === null || item.name === ".emptyFolderPlaceholder") {
          if (item.name !== ".emptyFolderPlaceholder") {
            folderItems.push({ name: item.name });
          }
        } else {
          fileItems.push(item);
        }
      });

      setFolders(folderItems);
      setFiles(fileItems);
      setSelectedFiles(new Set());
    } catch (e: any) {
      toast.error("Dosyalar yüklenemedi: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [currentBucket, currentPath]);

  useEffect(() => {
    if (currentBucket === null) {
      loadBuckets();
    } else {
      loadFiles();
    }
  }, [currentBucket, loadBuckets, loadFiles]);

  const navigateToRoot = () => {
    setCurrentBucket(null);
    setCurrentPath("");
    setSearchQuery("");
    setFiles([]);
    setFolders([]);
  };

  const enterBucket = (bucketId: string) => {
    setCurrentBucket(bucketId);
    setCurrentPath("");
    setSearchQuery("");
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setSearchQuery("");
  };

  const goUp = () => {
    if (currentPath) {
      const parts = currentPath.split("/");
      parts.pop();
      navigateTo(parts.join("/"));
    } else {
      navigateToRoot();
    }
  };

  const breadcrumbs = currentPath ? currentPath.split("/") : [];

  // Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentBucket) return;
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    let successCount = 0;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const path = fullPath(file.name);
      const { error } = await supabase.storage.from(currentBucket).upload(path, file, { upsert: true });
      if (error) {
        toast.error(`${file.name}: ${error.message}`);
      } else {
        successCount++;
      }
    }
    if (successCount > 0) toast.success(`${successCount} dosya yüklendi`);
    setUploading(false);
    loadFiles();
    e.target.value = "";
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!currentBucket || !newFolderName.trim()) return;
    const path = fullPath(newFolderName.trim()) + "/.emptyFolderPlaceholder";
    const { error } = await supabase.storage.from(currentBucket).upload(path, new Blob([""]), { upsert: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Klasör oluşturuldu");
    setNewFolderOpen(false);
    setNewFolderName("");
    loadFiles();
  };

  // Delete
  const handleDelete = async (names: string[]) => {
    if (!currentBucket) return;
    const paths = names.map((n) => fullPath(n));
    const { error } = await supabase.storage.from(currentBucket).remove(paths);
    if (error) { toast.error(error.message); return; }
    toast.success(`${names.length} öğe silindi`);
    loadFiles();
  };

  const handleDeleteFolder = async (name: string) => {
    if (!currentBucket) return;
    const folderPath = fullPath(name);
    const { data } = await supabase.storage.from(currentBucket).list(folderPath, { limit: 1000 });
    if (data?.length) {
      const paths = data.map((f) => `${folderPath}/${f.name}`);
      await supabase.storage.from(currentBucket).remove(paths);
    }
    await supabase.storage.from(currentBucket).remove([`${folderPath}/.emptyFolderPlaceholder`]);
    toast.success("Klasör silindi");
    loadFiles();
  };

  // Rename
  const handleRename = async () => {
    if (!currentBucket || !renameName.trim() || renameName === renameTarget) { setRenameOpen(false); return; }
    const oldPath = fullPath(renameTarget);
    const newPath = fullPath(renameName.trim());
    const { data: blob, error: dlErr } = await supabase.storage.from(currentBucket).download(oldPath);
    if (dlErr) { toast.error(dlErr.message); return; }
    const { error: upErr } = await supabase.storage.from(currentBucket).upload(newPath, blob, { upsert: true });
    if (upErr) { toast.error(upErr.message); return; }
    await supabase.storage.from(currentBucket).remove([oldPath]);
    toast.success("Dosya yeniden adlandırıldı");
    setRenameOpen(false);
    loadFiles();
  };

  // Edit
  const openEditor = async (name: string) => {
    if (!currentBucket) return;
    setEditTarget(name);
    setEditLoading(true);
    setEditOpen(true);
    const path = fullPath(name);
    const { data, error } = await supabase.storage.from(currentBucket).download(path);
    if (error) { toast.error(error.message); setEditOpen(false); return; }
    const text = await data.text();
    setEditContent(text);
    setEditLoading(false);
  };

  const saveEdit = async () => {
    if (!currentBucket) return;
    const path = fullPath(editTarget);
    const { error } = await supabase.storage.from(currentBucket).upload(path, new Blob([editContent]), { upsert: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Dosya kaydedildi");
    setEditOpen(false);
  };

  // Preview
  const openPreview = (name: string) => {
    if (!currentBucket) return;
    const path = fullPath(name);
    const { data } = supabase.storage.from(currentBucket).getPublicUrl(path);
    setPreviewUrl(data.publicUrl);
    setPreviewName(name);
    setPreviewOpen(true);
  };

  // Download
  const handleDownload = (name: string) => {
    if (!currentBucket) return;
    const path = fullPath(name);
    const { data } = supabase.storage.from(currentBucket).getPublicUrl(path);
    const a = document.createElement("a");
    a.href = data.publicUrl;
    a.download = name;
    a.target = "_blank";
    a.click();
  };

  // Copy URL
  const handleCopyUrl = (name: string) => {
    if (!currentBucket) return;
    const path = fullPath(name);
    const { data } = supabase.storage.from(currentBucket).getPublicUrl(path);
    navigator.clipboard.writeText(data.publicUrl);
    toast.success("URL kopyalandı");
  };

  const toggleSelect = (name: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBuckets = buckets.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const refresh = () => {
    if (currentBucket === null) loadBuckets();
    else loadFiles();
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-muted/30">
        <Button variant="outline" size="sm" onClick={navigateToRoot} title="Ana dizin">
          <Home className="h-4 w-4" />
        </Button>
        {(currentBucket !== null) && (
          <Button variant="outline" size="sm" onClick={goUp}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>

        {currentBucket !== null && (
          <>
            <div className="h-5 w-px bg-border" />
            <label className="cursor-pointer">
              <input type="file" multiple onChange={handleUpload} className="hidden" />
              <Button variant="default" size="sm" disabled={uploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  {uploading ? "Yükleniyor..." : "Yükle"}
                </span>
              </Button>
            </label>
            <Button variant="outline" size="sm" onClick={() => setNewFolderOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-1" />
              Yeni Klasör
            </Button>
            {selectedFiles.size > 0 && (
              <Button variant="destructive" size="sm" onClick={() => handleDelete(Array.from(selectedFiles))}>
                <Trash2 className="h-4 w-4 mr-1" />
                Sil ({selectedFiles.size})
              </Button>
            )}
          </>
        )}

        <div className="flex-1" />
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground bg-muted/10 border-b border-border overflow-x-auto">
        <button onClick={navigateToRoot} className="hover:text-foreground font-medium flex items-center gap-1">
          <Database className="h-3 w-3" />
          Storage
        </button>
        {currentBucket && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <button
              onClick={() => { setCurrentPath(""); }}
              className="hover:text-foreground font-medium flex items-center gap-1"
            >
              <HardDrive className="h-3 w-3" />
              {currentBucket}
            </button>
          </>
        )}
        {breadcrumbs.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 shrink-0" />
            <button
              onClick={() => navigateTo(breadcrumbs.slice(0, i + 1).join("/"))}
              className="hover:text-foreground font-medium"
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Yükleniyor...
          </div>
        ) : currentBucket === null ? (
          /* Bucket listing */
          filteredBuckets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <HardDrive className="h-8 w-8 opacity-30" />
              <p>Bucket bulunamadı</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="w-8 p-2" />
                  <th className="text-left p-2 font-medium">Bucket Adı</th>
                  <th className="text-left p-2 font-medium w-24">Erişim</th>
                  <th className="text-left p-2 font-medium w-40 hidden md:table-cell">Oluşturulma</th>
                  <th className="w-10 p-2" />
                </tr>
              </thead>
              <tbody>
                {filteredBuckets.map((bucket) => (
                  <tr
                    key={bucket.id}
                    className="border-b border-border/50 hover:bg-accent/30 cursor-pointer group"
                    onDoubleClick={() => enterBucket(bucket.id)}
                  >
                    <td className="p-2" />
                    <td className="p-2">
                      <button
                        onClick={() => enterBucket(bucket.id)}
                        className="flex items-center gap-2 text-foreground hover:text-primary"
                      >
                        <HardDrive className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium">{bucket.name}</span>
                      </button>
                    </td>
                    <td className="p-2">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        bucket.public
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-orange-500/10 text-orange-600"
                      )}>
                        {bucket.public ? "Public" : "Private"}
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground text-xs hidden md:table-cell">
                      {bucket.created_at
                        ? new Date(bucket.created_at).toLocaleString("tr-TR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })
                        : "-"}
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => enterBucket(bucket.id)}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          /* File/folder listing */
          filteredFolders.length === 0 && filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <Folder className="h-8 w-8 opacity-30" />
              <p>Bu klasör boş</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="w-8 p-2" />
                  <th className="text-left p-2 font-medium">Ad</th>
                  <th className="text-left p-2 font-medium w-24">Boyut</th>
                  <th className="text-left p-2 font-medium w-40 hidden md:table-cell">Tarih</th>
                  <th className="w-10 p-2" />
                </tr>
              </thead>
              <tbody>
                {filteredFolders.map((folder) => (
                  <tr
                    key={"d-" + folder.name}
                    className="border-b border-border/50 hover:bg-accent/30 cursor-pointer group"
                    onDoubleClick={() => navigateTo(fullPath(folder.name))}
                  >
                    <td className="p-2" />
                    <td className="p-2">
                      <button
                        onClick={() => navigateTo(fullPath(folder.name))}
                        className="flex items-center gap-2 text-foreground hover:text-primary"
                      >
                        <Folder className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{folder.name}</span>
                      </button>
                    </td>
                    <td className="p-2 text-muted-foreground">-</td>
                    <td className="p-2 text-muted-foreground hidden md:table-cell">-</td>
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigateTo(fullPath(folder.name))}>
                            <Folder className="h-4 w-4 mr-2" /> Aç
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFolder(folder.name)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file.name);
                  const selected = selectedFiles.has(file.name);
                  return (
                    <tr
                      key={"f-" + file.name}
                      className={cn(
                        "border-b border-border/50 hover:bg-accent/30 group",
                        selected && "bg-primary/5"
                      )}
                    >
                      <td className="p-2 text-center">
                        <button onClick={() => toggleSelect(file.name)}>
                          <div className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                            selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                          )}>
                            {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                        </button>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">
                        {formatSize(file.metadata?.size)}
                      </td>
                      <td className="p-2 text-muted-foreground text-xs hidden md:table-cell">
                        {file.created_at
                          ? new Date(file.created_at).toLocaleString("tr-TR", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit"
                            })
                          : "-"}
                      </td>
                      <td className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isPreviewable(file.name) && (
                              <DropdownMenuItem onClick={() => openPreview(file.name)}>
                                <Eye className="h-4 w-4 mr-2" /> Önizle
                              </DropdownMenuItem>
                            )}
                            {isEditable(file.name) && (
                              <DropdownMenuItem onClick={() => openEditor(file.name)}>
                                <FileCode className="h-4 w-4 mr-2" /> Düzenle
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDownload(file.name)}>
                              <Download className="h-4 w-4 mr-2" /> İndir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyUrl(file.name)}>
                              <Copy className="h-4 w-4 mr-2" /> URL Kopyala
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setRenameTarget(file.name);
                              setRenameName(file.name);
                              setRenameOpen(true);
                            }}>
                              <Edit3 className="h-4 w-4 mr-2" /> Yeniden Adlandır
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete([file.name])}>
                              <Trash2 className="h-4 w-4 mr-2" /> Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground border-t border-border bg-muted/20">
        {currentBucket === null ? (
          <span>{buckets.length} bucket</span>
        ) : (
          <span>{folders.length} klasör, {files.length} dosya</span>
        )}
        <span>
          {currentBucket === null
            ? "/ Storage"
            : `/${currentBucket}${currentPath ? "/" + currentPath : ""}`}
        </span>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Yeni Klasör</DialogTitle></DialogHeader>
          <Input
            placeholder="Klasör adı"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>İptal</Button>
            <Button onClick={handleCreateFolder}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Yeniden Adlandır</DialogTitle></DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>İptal</Button>
            <Button onClick={handleRename}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit File Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              {editTarget}
            </DialogTitle>
          </DialogHeader>
          {editLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Yükleniyor...</div>
          ) : (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 min-h-[300px] font-mono text-xs resize-none"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>İptal</Button>
            <Button onClick={saveEdit} disabled={editLoading}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh]">
          <DialogHeader><DialogTitle>{previewName}</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center">
            {previewName.toLowerCase().endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[60vh] rounded" />
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
