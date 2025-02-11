"use client"

import React, { useState } from "react";
import useContractStore from "@/stores/contractStore";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const Greetings: React.FC = () => {
  const { currentClientCodename } = useContractStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <header className="flex justify-between items-center py-2 pb-48">
        <div>
          <h1 className="text-2xl font-bold">
            Hello
            {currentClientCodename
              ? `, ${currentClientCodename}`
              : ""}{" "}
            👋
          </h1>
          <p>Select a candidate below to vote.</p>
        </div>
        <div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Settings className="h-5 w-5" />
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Settings</DialogTitle>
              <div className="p-4">
                {/* Add settings content here */}
                <p>Settings go here...</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
    </>
  );
};

export default Greetings;
