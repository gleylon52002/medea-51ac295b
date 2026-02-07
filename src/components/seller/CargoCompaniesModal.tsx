import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Truck, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface CargoCompaniesModalProps {
    onSelect?: (company: any) => void;
}

const CargoCompaniesModal = ({ onSelect }: CargoCompaniesModalProps) => {
    const [open, setOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

    const { data: companies, isLoading } = useQuery({
        queryKey: ["cargo-companies"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("cargo_companies")
                .select("*")
                .eq("is_active", true)
                .order("name");

            if (error) throw error;
            return data;
        },
    });

    const handleSelect = (company: any) => {
        setSelectedCompany(company.id);
        if (onSelect) {
            onSelect(company);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Truck className="h-4 w-4 mr-2" />
                    Kargo Firmaları
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Kargo Firması Seçin</DialogTitle>
                    <DialogDescription>
                        Sipariş göndermek için bir kargo firması seçin
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-20" />
                        ))
                    ) : companies && companies.length > 0 ? (
                        companies.map((company) => (
                            <button
                                key={company.id}
                                onClick={() => handleSelect(company)}
                                className={`
                  relative p-4 border-2 rounded-lg text-left transition-all hover:border-primary
                  ${selectedCompany === company.id ? "border-primary bg-primary/5" : "border-border"}
                `}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-primary" />
                                            <h3 className="font-semibold">{company.name}</h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Kod: {company.code}
                                        </p>
                                    </div>
                                    {selectedCompany === company.id && (
                                        <Check className="h-5 w-5 text-primary" />
                                    )}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-8">
                            <p className="text-muted-foreground">
                                Henüz kargo firması bulunamadı
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CargoCompaniesModal;
