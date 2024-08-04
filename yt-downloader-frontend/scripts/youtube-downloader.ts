import { NextResponse } from "next/server";
import React from "react";
import { Socket } from 'socket.io-client';

interface DownloadVideoProps {
  url: string;
  socketId: string;
}

export async function YoutubeDownloader(downloadData: { url: string }) {
  const resBody = JSON.stringify(downloadData);

  const res = await fetch("http://localhost:3001/video_info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: resBody,
  });

  const data = await res.json();

  return data;
}

export async function DownloadVideo(downloadData: { url: string; socketId: number; }) {
  // console.log("Data:", JSON.stringify(downloadData));
  const resBody = JSON.stringify(downloadData);
  const res = await fetch("http://localhost:3001/download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // " Access-Control-Allow-Origin": "*",
    },
    body: resBody,
  });

  return res;
}
