import { useState } from "react";
import { useProductQuestions, useAskQuestion } from "@/hooks/useInteraction";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Loader2, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

const ProductQuestions = ({ productId }: { productId: string }) => {
    const { user } = useAuth();
    const { data: questions, isLoading } = useProductQuestions(productId);
    const askQuestion = useAskQuestion();
    const [questionText, setQuestionText] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionText.trim()) return;
        askQuestion.mutate({ productId, question: questionText }, {
            onSuccess: () => setQuestionText("")
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Ask Question Form */}
            <div className="bg-muted/30 p-6 rounded-xl border">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Satıcıya Soru Sor
                </h3>
                {user ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Textarea
                            placeholder="Ürün hakkında merak ettiğiniz detayları sorun..."
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            className="bg-background min-h-[100px]"
                        />
                        <Button disabled={askQuestion.isPending || !questionText.trim()}>
                            {askQuestion.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Soruyu Gönder
                        </Button>
                    </form>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-4">Soru sormak için giriş yapmalısınız.</p>
                        <Button variant="outline" asChild>
                            <a href="/giris">Giriş Yap</a>
                        </Button>
                    </div>
                )}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Sorular ve Cevaplar ({questions?.length || 0})</h3>
                {questions?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-10 w-10 mx-auto opacity-20 mb-2" />
                        <p>Bu ürün için henüz soru sorulmamış.</p>
                    </div>
                ) : (
                    questions?.map((q) => (
                        <Card key={q.id}>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        S
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{q.question}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: tr })}
                                        </p>
                                    </div>
                                </div>

                                {q.answer ? (
                                    <div className="flex gap-3 bg-primary/5 p-4 rounded-lg ml-8">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">
                                            C
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-primary">Satıcı Yanıtı:</p>
                                            <p className="text-sm">{q.answer}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="ml-11">
                                        <p className="text-xs text-muted-foreground italic">Henüz cevaplanmamış.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductQuestions;
