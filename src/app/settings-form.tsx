"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import useContractStore from "@/stores/contractStore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SettingsForm = () => {
  const { address, currentClientCodename } = useContractStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      // Update contract store
      useContractStore.setState({
        address: formData
          .get("contractAddress")
          ?.toString()
          .toLowerCase() as `0x${string}`,
        currentClientCodename: formData.get("codename")?.toString() || null,
      });

      console.log("Settings updated", useContractStore.getState());

      //window.location.reload();

      setIsDialogOpen(false);

      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Settings className="h-5 w-5" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription>
          Update your settings.
        </DialogDescription>
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contractAddress">Contract Address</Label>
              <Input
                id="contractAddress"
                name="contractAddress"
                placeholder="0x..."
                defaultValue={address}
                pattern="^0x[a-fA-F0-9]{40}$"
                title="Please enter a valid Ethereum address starting with 0x"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codename">
                Your Codename
                <p className="text-sm text-muted-foreground">It will be hidden from the voting list</p>
              </Label>
              <Input
                id="codename"
                name="codename"
                placeholder="Enter your codename"
                defaultValue={currentClientCodename || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme" className="w-full block">Theme</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsForm;
