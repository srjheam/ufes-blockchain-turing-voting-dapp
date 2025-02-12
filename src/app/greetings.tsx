"use client"

import React from "react";
import useContractStore from "@/stores/contractStore";
import SettingsForm from "@/app/settings-form";

const Greetings: React.FC = () => {
  const { currentClientCodename, candidates } = useContractStore();

  return (
    <>
      <header className="flex justify-between items-center pb-32">
        <div>
          <h1 className="text-2xl font-bold">
            Hello
            {currentClientCodename
              ? `, ${currentClientCodename}`
              : ""}{" "}
            👋
          </h1>
          {currentClientCodename && (
            <p>
              Looks like you already have {Math.round((candidates?.find(
                (c) => c.codename === currentClientCodename
              )?.saTuringAmmount ?? .0) * 10 ** -18 * 100) / 100} votes.
            </p>
          )}
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
