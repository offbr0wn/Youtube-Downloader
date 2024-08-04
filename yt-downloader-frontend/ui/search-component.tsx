"use client";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import React, { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
// import io from "socket.io-client";
import DropdownComponent from "@/components/dropdown-component";
import { YoutubeDownloader } from "@/scripts/youtube-downloader";

export default function SearchComponent({ setResult }) {
  const [text, setText] = useState("");
  const [value] = useDebounce(text, 10);
  const [socket, setSocket] = useState(null);

  const handleClicked = async () => {
    const urlData = {
      url: value,
      
    };

    try {
      const res = await YoutubeDownloader(urlData);
      setResult(res);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Input
      endContent={
        <div className=" flex gap-1 ">
          <DropdownComponent />
          <Button color="secondary" variant="shadow" onClick={handleClicked}>
            Get Video
          </Button>
        </div>
      }
      size="lg"
      type="email"
      onChange={(e) => {
        setText(e.target.value);
      }}
      placeholder="Paste your link here"
      // defaultValue="junior@nextui.org"
      className="max-w-full   "
      variant={"faded"}
      // label="Email"
      radius={"md"}
    />
  );
}
