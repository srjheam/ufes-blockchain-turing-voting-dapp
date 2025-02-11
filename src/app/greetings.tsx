"use client"

import React, { useState } from "react";
import useContractStore from "@/stores/contractStore";
import SettingsForm from "@/app/settings-form";

const Greetings: React.FC = () => {
  const { currentClientCodename } = useContractStore();

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
         <SettingsForm />
        </div>
      </header>
    </>
  );
};

export default Greetings;
