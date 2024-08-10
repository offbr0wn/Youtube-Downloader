"use client";

import { FaRegHandPointDown } from "react-icons/fa";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { Suspense } from "react";

import { title, subtitle } from "@/components/primitives";
import { FlipWords } from "@/components/flip-words";
import { cn } from "@/lib/utils";
import SearchComponent from "@/ui/search-component";
import { MemoizedMovie } from "@/components/yt-card-download";
import { Spinner } from "@nextui-org/react";

interface VideoInfo {
  title: string;
  thumbnail: string;
  author: string;
  length: string;
  views: string;
  publish_date: string;
  url: string;
  description: string;
  error?: string;
}

interface Error {
  error: string;
}

export default function Home() {
  const words = [
    "Youtube ",
    "Tiktok ",
    "Instagram ",
    "Soundcloud",
    "Facebook ",
  ];

  const [result, setResult] = useState<VideoInfo | Error>();

  const hasError = result?.error;
  // console.log("Tesiting", process.env.NEXT_PUBLIC_YT_API);

  const RenderCard = () => {
    if (result && !hasError) {
      return (
        <Suspense fallback={<Spinner size="lg" />}>
          <MemoizedMovie result={result} />
        </Suspense>
      );
    } else {
      return (
        <h1 className="text-center text-4xl text-default-600 font-bold ">
          {result?.error}, Please Select a different resolution 
        </h1>
      );
    }
  };

  return (
    <section className="flex flex-col items-center justify-center gap-10 py-8 md:py-10 ">
      <div className="  text-center justify-center overflow-y-hidden w-auto ">
        <h1 className={cn(title(), " md:text-md text-[30px]")}>
          <FlipWords words={words} />
        </h1>
        <h1 className={cn(title({ color: "violet" }), "md:text-lg text-md")}>
          Downloader&nbsp;
        </h1>
        <br />

        <h2
          className={cn(
            subtitle({ class: "mt-4 ," }),
            "md:text-lg text-md flex items-center justify-center gap-2"
          )}
        >
          Paste your link below to download <FaRegHandPointDown />
        </h2>
      </div>

      <div className="flex justify-center items-center md:w-[60vw] sm:w-full">
        <SearchComponent setResult={setResult} />
      </div>

      <div className="mt-4">
        <RenderCard />
      </div>
    </section>
  );
}
