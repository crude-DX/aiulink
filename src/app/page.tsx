import { Icons } from '@/components/icons';
import { SearchBar } from '@/components/search-bar';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center text-center gap-4 animate-fade-in-down">
        <Icons.logo className="h-20 w-20 text-primary" />
        <h1 className="text-5xl font-headline font-bold tracking-tight text-primary sm:text-6xl">
          InnoSearch
        </h1>
        <p className="text-lg text-muted-foreground md:text-xl">
          Your internal knowledge, unified and verified.
        </p>
      </div>
      <div className="w-full max-w-2xl mt-12 animate-fade-in-up">
        <SearchBar />
      </div>
    </main>
  );
}
