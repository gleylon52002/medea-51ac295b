import { useState } from "react";
import { useSellerQuestions } from "@/hooks/useInteraction";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, HelpCircle, Check, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

const SellerQuestions = () => {
    const { questions, answerQuestion } = useSellerQuestions();
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState("");

    const handleAnswer = async (id: string) => {
        if (!answerText.trim()) return;
        try {
            await answerQuestion.mutateAsync({ questionId: id, answer: answerText });
            setAnsweringId(null);
            setAnswerText("");
        } catch (error) {
            console.error("Answer error:", error);
        }
    };

    if (questions.isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <HelpCircle className="h-6 w-6 text-primary" />
                    Müşteri Soruları
                </h1>
                <p className="text-muted-foreground">Ürünleriniz hakkında gelen soruları yanıtlayın</p>
            </div>

            <div className="space-y-4">
                {questions.data?.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <MessageCircle className="h-12 w-12 mx-auto opacity-20 mb-4" />
                            <p>Henüz soru bulunmuyor.</p>
                        </CardContent>
                    </Card>
                ) : (
                    questions.data?.map((q: any) => (
                        <Card key={q.id}>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className="mb-2">
                                            {q.products?.name}
                                        </Badge>
                                        <p className="text-sm font-semibold">{q.question}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: tr })}
                                        </p>
                                    </div>
                                    {q.answer ? (
                                        <Badge className="bg-green-500">Cevaplandı</Badge>
                                    ) : (
                                        <Badge variant="secondary">Cevap Bekliyor</Badge>
                                    )}
                                </div>

                                {answeringId === q.id ? (
                                    <div className="space-y-3 pt-2">
                                        <Textarea
                                            placeholder="Cevabınızı yazın..."
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleAnswer(q.id)} disabled={answerQuestion.isPending}>
                                                {answerQuestion.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                                Cevabı Gönder
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setAnsweringId(null)}>İptal</Button>
                                        </div>
                                    </div>
                                ) : q.answer ? (
                                    <div className="bg-muted p-4 rounded-lg">
                                        <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Cevabınız:</p>
                                        <p className="text-sm">{q.answer}</p>
                                        <Button variant="link" size="sm" className="h-8 p-0 mt-2" onClick={() => {
                                            setAnsweringId(q.id);
                                            setAnswerText(q.answer);
                                        }}>
                                            Düzenle
                                        </Button>
                                    </div>
                                ) : (
                                    <Button size="sm" onClick={() => {
                                        setAnsweringId(q.id);
                                        setAnswerText("");
                                    }}>
                                        Yanıtla
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default SellerQuestions;
