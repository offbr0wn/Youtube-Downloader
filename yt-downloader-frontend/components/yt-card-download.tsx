/* eslint-disable prettier/prettier */
"use client";
import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Image, Progress } from "@nextui-org/react";
import moment from "moment";
import { NextResponse } from "next/server";
import { DownloadVideo, isProduction } from "@/scripts/youtube-downloader";
import { io, Socket } from "socket.io-client";
import DefaultEventsMap from "socket.io-client";

interface DownloadDataProps {
  url: string;
  socketId: string | number | undefined;
  formatType: string;
}
export function YtCardDownload({ result }: any) {
  const [value, setValue] = useState(0);
  const [socket, setSocket] = useState<Socket<
    typeof DefaultEventsMap,
    typeof DefaultEventsMap
  > | null>(null);
  useEffect(() => {
    // Initialize the socket connection
    const socketInstance = io(`${isProduction}`);

    setSocket(socketInstance);

    // Listen for progress events
    socketInstance.on("progress", (data) => {
      setValue(data.percent);
    });

    // Cleanup on component unmount
    return () => {
      socketInstance.off("progress");
      socketInstance.close();
    };
  }, []);

  const { url, thumbnail, title, text, length } = result ?? {};
  const duration = moment.duration(length, "seconds");
  const hours = duration.hours();
  const minutes = duration.minutes();

  const downloadVideo = async () => {
    if (!socket || !socket.connected) {
      console.error("Socket is not initialized or connected");
      throw new Error("Invalid socket ID");
    }
    // if (typeof socket.id !== "number") {
    //   throw new Error("Invalid socket ID");
    // }

    const downloadData: DownloadDataProps = {
      url: url,
      socketId: socket.id,
      formatType: "video",
    };
    try {
      const res = await DownloadVideo(downloadData);
      console.log(res);
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = downloadUrl;
        a.download = `${title}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        console.error("Failed to download video");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Card
      isBlurred
      className="border-none bg-background/60 dark:bg-default-100/50 min-w-[80vw] "
      shadow="sm"
    >
      <CardBody>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-6 md:gap-4 items-center justify-center">
          <div className="relative col-span-6 md:col-span-4">
            <Image
              alt="Album cover"
              className="object-cover"
              height={200}
              shadow="md"
              src={thumbnail}
              width="100%"
            />
          </div>

          <div className="flex flex-col col-span-6 md:col-span-8 gap-2 px-2">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-0">
                <h1 className="text-2xl font-medium mt-2">{title}</h1>
              </div>
            </div>

            <div className="flex flex-col mt-3 gap-1">
              <div className="flex justify-between">
                <h1 className="text-default-600 text-sm">URL: {url}</h1>

                <h3 className="text-default-600 text-sm">
                  Duration: {`${hours}h ${minutes}m`}
                </h3>
              </div>
            </div>

            <div className="flex w-full items-center justify-start">
              <Progress
                aria-label="Downloading..."
                classNames={{
                  base: "max-w-lg ",
                  track: "drop-shadow-md border border-default ",
                  indicator: "bg-gradient-to-r from-pink-500 to-yellow-500",
                  label: "tracking-wider font-bold text-default-600",
                  value: "text-foreground font-bold ",
                }}
                color="success"
                showValueLabel={true}
                size="lg"
                value={value}
              />
            </div>

            <div className="flex w-full items-center justify-center pt-4">
              <Button
                className="w-full"
                color="secondary"
                size="lg"
                onClick={downloadVideo}
                isDisabled={value === 95}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export const MemoizedMovie = React.memo(YtCardDownload);
