"use client";

import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import { Button } from "@nextui-org/button";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/reducers/store";
import { setSelectedKeys, setSelectedQuality } from "@/reducers/dropdownSlice";
// import { setSelectedKeys } from "../redux/dropdownSlice";

export default function DropdownComponent() {
  // const [selectedKeys, setSelectedKeys] = React.useState(new Set(["mp4"]));
  const type = ["mp4", "mp3", "webm"];
  const quality = ["360p", "480p", "720p", "1080p", "1440p", "2160p"];

  const selectedKeys = useSelector(
    (state: RootState) => state.dropDown.selectedKeys
  );
  const selectedQuality = useSelector(
    (state: RootState) => state.dropDown.selectedQuality
  );
  const dispatch = useDispatch();
  const selectedValue = React.useMemo(
    () => Array.from(selectedKeys).join(", ").replaceAll("_", " "),
    [selectedKeys]
  );

  const selectedQualityValue = React.useMemo(
    () => Array.from(selectedQuality).join(", ").replaceAll("_", " "),
    [selectedQuality]
  );

  const handleSelectionChange = (keys: Set<string>) => {
    dispatch(setSelectedKeys(keys));
  };

  const handleQualityChange = (keys: Set<string>) => {
    dispatch(setSelectedQuality(keys));
  };

  return (
    <>
      <Dropdown className="capitalize ">
        <DropdownTrigger>
          <Button className="capitalize" variant="shadow">
            {selectedValue}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          disallowEmptySelection
          aria-label="Single selection example"
          selectedKeys={selectedKeys}
          selectionMode="single"
          variant="shadow"
          // disabledKeys={["webm", "mp4"]}
          closeOnSelect
          onSelectionChange={handleSelectionChange}
        >
          {type.map((item) => (
            <DropdownItem key={item}>{item}</DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      {selectedValue !== "mp3" && (
        <Dropdown className="capitalize ">
          <DropdownTrigger>
            <Button className="capitalize" variant="shadow">
              {selectedQualityValue}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label="Single selection example"
            selectedKeys={selectedQuality}
            selectionMode="single"
            variant="shadow"
            // disabledKeys={["webm", "mp4"]}
            onSelectionChange={handleQualityChange}
          >
            {quality.map((item) => (
              <DropdownItem key={item}>{item}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      )}
    </>
  );
}
