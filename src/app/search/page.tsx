"use client";

import { analyzeSearchIntent, AnalyzeSearchIntentOutput } from "@/ai/flows/analyze-search-intent";
import { generateDraftAnswer } from "@/ai/flows/generate-draft-answer";
import { Icons } from "@/components/icons";
import { SearchBar } from "@/components/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  FolderKanban,
  Loader2,
  MessageCircleQuestion,
  Share2,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

type WorkflowStatus = "analyzing" | "searching" | "generating" | "confirming" | "feedback_submitted" | "error";
type StepStatus = "pending" | "loading" | "complete" | "error";

interface MockSearchResult {
  source: string;
  title: string;
  snippet: string;
  updated: string;
  link: string;
}

const sourceIcons: { [key: string]: React.ElementType } = {
  "Knowledge Base": BookOpen,
  Database: Database,
  API: Share2,
  "File System": FolderKanban,
  default: FileText,
};

function WorkflowStep({ title, status, children, isVisible }: { title: string; status: StepStatus; children: React.ReactNode; isVisible: boolean }) {
  if (!isVisible) return null;

  const StatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
      case "complete":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "error":
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />;
    }
  };

  return (
    <div className="flex gap-6 animate-fade-in-up">
      <div className="flex flex-col items-center">
        <StatusIcon />
        <div className={cn("w-px h-full mt-2", status === 'pending' ? 'bg-border' : 'bg-transparent')}></div>
      </div>
      <div className="flex-1 pb-8">
        <Card className={cn("transition-all", status === 'loading' ? 'border-primary' : '')}>
          <CardHeader>
            <CardTitle className="text-xl font-headline">{title}</CardTitle>
          </CardHeader>
          {status !== "pending" && <CardContent>{children}</CardContent>}
        </Card>
      </div>
    </div>
  );
}

function SearchResultDisplay({ query }: { query: string }) {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("analyzing");
  const [intentData, setIntentData] = useState<AnalyzeSearchIntentOutput | null>(null);
  const [mockSearchResults, setMockSearchResults] = useState<MockSearchResult[]>([]);
  const [draftAnswer, setDraftAnswer] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const runSearchWorkflow = async () => {
      try {
        if (isCancelled) return;
        setWorkflowStatus("analyzing");
        setError(null);
        setIntentData(null);
        setMockSearchResults([]);
        setDraftAnswer(null);
        setUserFeedback(null);

        // 1. Analyze Intent
        const intentResult = await analyzeSearchIntent({ query });
        if (isCancelled) return;
        setIntentData(intentResult);
        await new Promise(resolve => setTimeout(resolve, 500));
        setWorkflowStatus("searching");

        // 2. Search Sources (Mock)
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (isCancelled) return;
        const searchResults: MockSearchResult[] = intentResult.dataSources.map(source => ({
          source,
          title: `Relevant Document from ${source}`,
          snippet: `This is a mock search result for the query "${query}" from the ${source}. It contains relevant keywords and information.`,
          updated: new Date().toISOString().split('T')[0],
          link: "#",
        }));
        // AiU 의료비 관련 질문
        if (query.toLowerCase().includes("aiu 의료비")) {
          searchResults.push({
            source: "Knowledge Base",
            title: "AiU 의료비 자동화 보안 검토 절차",
            snippet: "AiU 의료비 자동화 보안 검토 절차는 정보보안팀의 가이드라인(DOC-SEC-1138)을 따릅니다. 담당자는 이보안(security.lee@example.com)입니다.",
            updated: "2024-03-15",
            link: "#"
          });
        }

        // 1. PE 생산량 및 MI 지수 관련 질문
        if (query.toLowerCase().includes("pe") && (query.toLowerCase().includes("생산량") || query.toLowerCase().includes("mi"))) {
          searchResults.push({
            source: "PE-Master",
            title: "PE 생산량 및 MI 지수 분석",
            snippet: `지난달 PE 총 생산량 120,000톤 중 MI 지수 2.0 이상 제품은 36.5% (43,800톤)를 차지했습니다.`,
            updated: "2025-09-08",
            link: "#",
            rawData: { /* Case 1 Raw Data */ }
          });
        }

        // 2. PP 판매 및 재고 관련 질문
        if (query.toLowerCase().includes("pp") && (query.toLowerCase().includes("판매") || query.toLowerCase().includes("재고"))) {
          searchResults.push({
            source: "PP-Sales/Inventory",
            title: "PP 판매 및 재고 현황",
            snippet: `이번 달 PP 총 판매량은 50,200톤이며, 재고는 4,500톤 감소했습니다.`,
            updated: "2025-09-08",
            link: "#",
            rawData: { /* Case 2 Raw Data */ }
          });
        }

        // 3. CDU 정기보수로 인한 생산 차질 관련 질문
        if (query.toLowerCase().includes("cdu") && (query.toLowerCase().includes("정기보수") || query.toLowerCase().includes("차질"))) {
          searchResults.push({
            source: "Analytics",
            title: "CDU 정기보수 영향 분석",
            snippet: `다음 주 CDU 정기보수로 인해 예상되는 총 생산 차질은 1,850톤입니다. (CDU: 1,600톤, PE: 250톤)`,
            updated: "2025-09-08",
            link: "#",
            rawData: { /* Case 3 Raw Data */ }
          });
        }

        // 4. CDU 가동률 원인 분석 관련 질문
        if (query.toLowerCase().includes("cdu") && query.toLowerCase().includes("가동률") && (query.toLowerCase().includes("이유") || query.toLowerCase().includes("원인"))) {
          searchResults.push({
            source: "CDU-Dashboard",
            title: "CDU 가동률 하락 원인 분석",
            snippet: `지난 분기 CDU 가동률은 기준 대비 3.1%p 하락한 87.2%를 기록했습니다. 주요 원인은 원유 성상(-1.8%p)과 유틸리티 비용(-0.9%p)입니다.`,
            updated: "2025-09-08",
            link: "#",
            rawData: { /* Case 4 Raw Data */ }
          });
        }

        // 5. BOP 제품 단가 비교 관련 질문
        if (query.toLowerCase().includes("bop") && (query.toLowerCase().includes("단가") || query.toLowerCase().includes("가격"))) {
          searchResults.push({
            source: "BOP-Pricing",
            title: "BOP-150N 단가 비교 분석",
            snippet: `올해 상반기 BOP-150N의 평균 단가는 톤당 985,000원으로, 전년 동기 대비 8.24% 상승했습니다.`,
            updated: "2025-09-08",
            link: "#",
            rawData: { /* Case 5 Raw Data */ }
          });
        }
        setMockSearchResults(searchResults);
        setWorkflowStatus("generating");
        
        // 3. Generate Draft Answer
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (isCancelled) return;
        const searchResultsText = searchResults.map(r => `Source: ${r.source}\nTitle: ${r.title}\nSnippet: ${r.snippet}`).join('\n\n');
        const answerResult = await generateDraftAnswer({ query, searchResults: searchResultsText });
        if (isCancelled) return;
        setDraftAnswer(answerResult.answer);
        setWorkflowStatus("confirming");

      } catch (e) {
        if (isCancelled) return;
        console.error(e);
        setError("An unexpected error occurred. Please try again.");
        setWorkflowStatus("error");
      }
    };

    if (query) {
      runSearchWorkflow();
    }

    return () => {
      isCancelled = true;
    };
  }, [query]);

  const handleFeedback = (feedback: string) => {
    setUserFeedback(feedback);
    setWorkflowStatus("feedback_submitted");
  };

  const getStepStatus = (step: number): StepStatus => {
    const statusMap: { [key in WorkflowStatus]: number } = {
      analyzing: 1, searching: 2, generating: 3, confirming: 4, feedback_submitted: 4, error: 5,
    };
    const currentStep = statusMap[workflowStatus];
    if (workflowStatus === 'error' && step === currentStep -1 ) return 'error';
    if (step < currentStep) return "complete";
    if (step === currentStep && workflowStatus !== 'error') return "loading";
    return "pending";
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Searching for: <span className="text-[rgb(0,153,153)]">{query}</span></h2>
      <p className="text-muted-foreground mb-8">Follow the automated process as we retrieve and verify your answer.</p>
      
      <div className="relative">
        <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-border -z-10"></div>
        <WorkflowStep title="Analyzing Intent" status={getStepStatus(1)} isVisible={workflowStatus !== 'error'}>
          {intentData ? (
            <div>
              <p className="font-semibold">{intentData.intent}</p>
              <div className="flex gap-2 mt-2">
                <p>Routing to:</p>
                {intentData.dataSources.map((source) => (
                  <Badge key={source} variant="secondary">{source}</Badge>
                ))}
              </div>
            </div>
          ) : <Skeleton className="h-12 w-full" />}
        </WorkflowStep>

        <WorkflowStep title="Searching Data Sources" status={getStepStatus(2)} isVisible={getStepStatus(1) === 'complete' && workflowStatus !== 'error'}>
          <div className="space-y-4">
            {mockSearchResults.length > 0 ? (
              mockSearchResults.map((result, index) => {
                const Icon = sourceIcons[result.source] || sourceIcons.default;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <Icon className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[rgb(0,153,153)]">{result.title}</p>
                      <p className="text-sm text-muted-foreground">{result.snippet}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              intentData?.dataSources.map(source => <Skeleton key={source} className="h-16 w-full" />)
            )}
          </div>
        </WorkflowStep>

        <WorkflowStep title="Generating Answer" status={getStepStatus(3)} isVisible={getStepStatus(2) === 'complete' && workflowStatus !== 'error'}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </WorkflowStep>

        <WorkflowStep title="Final Answer & Confirmation" status={getStepStatus(3)} isVisible={getStepStatus(2) === 'complete' || workflowStatus === 'feedback_submitted'}>
          {draftAnswer ? (
            <>
              <div className="prose prose-sm max-w-none text-card-foreground">{draftAnswer}</div>
              <Separator className="my-6" />
              <div>
                <p className="text-sm font-semibold mb-3">Sources:</p>
                <div className="space-y-3">
                  {mockSearchResults.map((result, index) => {
                    const Icon = sourceIcons[result.source] || sourceIcons.default;
                    return (
                      <a href={result.link} key={index} className="flex items-center gap-3 group text-sm">
                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"/>
                        <span className="flex-1 group-hover:text-primary transition-colors">{result.title}</span>
                        <span className="text-muted-foreground text-xs">{result.updated}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground"/>
                      </a>
                    )
                  })}
                </div>
              </div>
              <CardFooter className="mt-8 -mb-2 -mx-2">
                {workflowStatus === 'feedback_submitted' ? (
                  <div className="w-full text-center flex items-center justify-center gap-2 p-4 bg-green-50 rounded-lg text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-medium">Thank you for your feedback!</p>
                  </div>
                ) : (
                  <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                    <p className="font-semibold">Was this answer helpful?</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleFeedback('yes')}><ThumbsUp className="mr-2"/> Yes</Button>
                      <Button variant="outline" size="sm" onClick={() => handleFeedback('no')}><ThumbsDown className="mr-2"/> No</Button>
                      <Button variant="outline" size="sm" onClick={() => handleFeedback('partial')}><MessageCircleQuestion className="mr-2"/> Partially</Button>
                    </div>
                  </div>
                )}
              </CardFooter>
            </>
          ) : (
             <Skeleton className="h-24 w-full" />
          )}
        </WorkflowStep>
      </div>

      {workflowStatus === 'error' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><XCircle/> An Error Occurred</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 mr-4">
            <Icons.logo className="h-8 w-8 text-primary" />
            <span className="hidden sm:inline-block text-xl font-bold font-headline text-[rgb(0,153,153)]">
              AiU Link
            </span>
          </Link>
          <div className="flex-1 max-w-2xl">
            <SearchBar initialQuery={query} />
          </div>
           <div className="w-0 sm:w-32"></div> {/* Spacer */}
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {query ? (
          <SearchResultDisplay query={query} />
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Enter a query in the search bar above to start.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SuspendedSearchPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <SearchPage />
    </Suspense>
  )
}
