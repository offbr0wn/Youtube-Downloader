import { NextResponse } from "next/server";
import React from "react";
import { Socket } from "socket.io-client";

interface DownloadVideoProps {
  url: string;
  socketId: string;
}
export const isProduction =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_YT_API
    : "http://localhost:3001";
export async function YoutubeDownloader(downloadData: { url: string }) {
  const resBody = JSON.stringify(downloadData);

  const res = await fetch(`${isProduction}/video_info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: resBody,
  });

  const data = await res.json();

  return data;
}

export async function DownloadVideo(downloadData: {
  url: string;
  socketId: string | number | undefined;
}) {
  // console.log("Data:", JSON.stringify(downloadData));
  const resBody = JSON.stringify(downloadData);

  const res = await fetch(`${isProduction}/download`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // " Access-Control-Allow-Origin": "*",
    },
    body: resBody,
  });

  return res;
}
