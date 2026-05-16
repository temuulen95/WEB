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
    <main className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <div className="bg-black border-b-4 border-white px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-10 bg-white"></div>
          <div>
            <div className="text-xs text-gray-400 tracking-widest uppercase">Season Ranking</div>
            <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Leaderboard</h1>
          </div>
        </div>
      </div>

      {/* ランキングリスト */}
      <div className="px-3 py-3 flex flex-col gap-2">
        {players.map((player, index) => (
          <div
            key={player.name}
            className={`flex items-center gap-3 p-3 rounded ${
              index === 0
                ? "bg-white text-black"
                : index === 1
                ? "bg-gray-200 text-black"
                : index === 2
                ? "bg-gray-400 text-black"
                : "bg-gray-900 text-white border border-gray-800"
            }`}
          >
            {/* ランク */}
            <div className={`text-2xl font-black w-8 text-center ${index === 0 ? "text-black" : "text-gray-400"}`}>
              {index + 1}
            </div>

            {/* 画像 */}
            <img
              src={getImage(player)}
              alt={player.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-black"
            />

            {/* 名前・成績 */}
            <div className="flex-1">
              <div className="font-black text-sm uppercase tracking-wide">{player.name}</div>
              <div className={`text-xs ${index < 3 ? "text-gray-600" : "text-gray-500"}`}>
                {player.wins}W - {player.losses}L
              </div>
            </div>

            {/* ポイント */}
            <div className="text-right">
              <div className="text-xl font-black">{player.points}</div>
              <div className={`text-xs uppercase tracking-widest ${index < 3 ? "text-gray-600" : "text-gray-500"}`}>pts</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}