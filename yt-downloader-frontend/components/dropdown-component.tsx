"use client";

import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import { Button } from "@nextui-org/button";

export default function DropdownComponent() {
  const [selectedKeys, setSelectedKeys] = React.useState(new Set(["mp4"]));
  const type = ["mp4", "mp3", "webm"];
  const selectedValue = React.useMemo(
    () => Array.from(selectedKeys).join(", ").replaceAll("_", " "),
    [selectedKeys]
  );
console.log(selectedValue === "mp4" ? "video" : "audio");
  return (
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
        onSelectionChange={setSelectedKeys}
      >
        {type.map((item) => (
          <DropdownItem key={item}>{item}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
