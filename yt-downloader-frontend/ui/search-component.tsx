"use client";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import React, { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
// import io from "socket.io-client";
import DropdownComponent from "@/components/dropdown-component";
import { GetVideoInfo } from "@/scripts/youtube-downloader";
import { RootState } from "@/reducers/store";
import { useSelector } from "react-redux";

export default function SearchComponent({ setResult }: any) {
  const [text, setText] = useState("");
  const [value] = useDebounce(text, 10);
  const [socket, setSocket] = useState(null);
  const [dropdownValue, setDropdownValue] = useState(false);
  const selectedKeys = useSelector(
    (state: RootState) => state.dropDown.selectedKeys
  );

  const selectedValue = React.useMemo(
    () => Array.from(selectedKeys).join(", ").replaceAll("_", " "),
    [selectedKeys]
  );

  const selectedQuality = useSelector(
    (state: RootState) => state.dropDown.selectedQuality
  );

  const selectedQualityValue = React.useMemo(
    () => Array.from(selectedQuality).join(", ").replaceAll("_", " "),
    [selectedQuality]
  );

  

  const handleClicked = async () => {
    const urlData = {
      url: value,
      formatType: selectedValue,
      quality:selectedQualityValue
    };

    try {
      const res = await GetVideoInfo(urlData);
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
