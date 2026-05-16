"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const imageMap: Record<string, string> = {
  Sumiya: "/Sumiya 10.jpg",
  Toshno: "/Toshno 4.jpg",
  Hashaa: "/Hashaa 5.jpg",
  Battulga: "/Battulga 8.jpg",
  Bilguun: "/Bilguun 33.jpg",
  Davka: "/Davka 3.jpg",
  Eba: "/eba 7.jpg",
  Jamiyan: "/Jamiyan 21.jpg",
  Miigaa: "/Miigaa 12.jpg",
  Ochiroo: "/Ochiroo 55.jpg",
  Telmen: "/Telmen 0.jpg",
  Zolboo: "/Zolboo 9.jpg",
};

type Player = {
  name: string;
  image: string;
  points: number;
  wins: number;
  losses: number;
};

export default function RankingPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select("*")
        .order("points", { ascending: false });
      if (data) setPlayers(data);
    };

    fetchPlayers();

    const channel = supabase
      .channel("players")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => {
        fetchPlayers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getImage = (player: Player) => {
    if (player.image && player.image.startsWith("http")) return player.image;
    return imageMap[player.name] || "/file.svg";
  };

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">🏀 Ranking</h1>
      <div className="flex flex-col gap-2">
        {players.map((player, index) => (
          <div
            key={player.name}
            className="border border-gray-700 rounded p-3 flex items-center gap-3"
          >
            <div className="text-lg font-bold w-8 text-center text-yellow-400">
              #{index + 1}
            </div>
            <img
              src={getImage(player)}
              alt={player.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="font-bold">{player.name}</div>
              <div className="text-xs text-gray-400">
                W: {player.wins} / L: {player.losses}
              </div>
            </div>
            <div className="text-xl font-bold text-blue-400">
              {player.points}pts
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}