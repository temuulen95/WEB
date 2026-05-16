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
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Ranking Table</h1>
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-700 text-left">
          <thead className="bg-gray-900">
            <tr>
              <th className="p-3">Rank</th>
              <th className="p-3">Player</th>
              <th className="p-3">Points</th>
              <th className="p-3">Wins</th>
              <th className="p-3">Losses</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.name} className="border-t border-gray-800 hover:bg-gray-900">
                <td className="p-3 font-bold">#{index + 1}</td>
                <td className="p-3 flex items-center gap-3">
                  <img
                    src={getImage(player)}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {player.name}
                </td>
                <td className="p-3">{player.points}</td>
                <td className="p-3 text-green-400">{player.wins}</td>
                <td className="p-3 text-red-400">{player.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}