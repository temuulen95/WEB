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

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase.from("players").select("*");
      if (data) setPlayers(data);
    };
    fetchPlayers();
  }, []);

  const updatePlayer = async (name: string, changes: Partial<Player>) => {
    const player = players.find((p) => p.name === name)!;
    const updated = { ...player, ...changes };
    await supabase.from("players").update(changes).eq("name", name);
    setPlayers((prev) => prev.map((p) => (p.name === name ? updated : p)));
  };

  const addPlayer = async () => {
    if (!newName || !newImage) return;
    setUploading(true);

    const fileExt = newImage.name.split(".").pop();
    const filePath = `${newName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("players")
      .upload(filePath, newImage, { upsert: true });

    if (uploadError) {
      alert("画像アップロード失敗: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("players")
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    const { error: insertError } = await supabase.from("players").insert({
      name: newName,
      image: imageUrl,
      points: 0,
      wins: 0,
      losses: 0,
    });

    if (insertError) {
      alert("登録失敗: " + insertError.message);
    } else {
      const { data } = await supabase.from("players").select("*");
      if (data) setPlayers(data);
      setNewName("");
      setNewImage(null);
    }

    setUploading(false);
  };

  const getImage = (player: Player) => {
    if (player.image && player.image.startsWith("http")) return player.image;
    return imageMap[player.name] || "/file.svg";
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      {/* 選手一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {players.map((player) => (
          <div
            key={player.name}
            className="border border-gray-700 p-4 rounded flex gap-4 items-center"
          >
            <img
              src={getImage(player)}
              alt={player.name}
              className="w-16 h-16 rounded object-cover"
            />
            <div className="flex-1">
              <div className="text-xl font-bold">{player.name}</div>
              <div className="text-sm text-gray-400">
                Points: {player.points} | Wins: {player.wins} | Losses: {player.losses}
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button onClick={() => updatePlayer(player.name, { points: player.points + 1 })} className="bg-blue-600 px-3 py-1 rounded">+1 Point</button>
                <button onClick={() => updatePlayer(player.name, { points: Math.max(0, player.points - 1) })} className="bg-gray-600 px-3 py-1 rounded">-1 Point</button>
                <button onClick={() => updatePlayer(player.name, { wins: player.wins + 1 })} className="bg-green-600 px-3 py-1 rounded">+Win</button>
                <button onClick={() => updatePlayer(player.name, { wins: Math.max(0, player.wins - 1) })} className="bg-green-900 px-3 py-1 rounded">-Win</button>
                <button onClick={() => updatePlayer(player.name, { losses: player.losses + 1 })} className="bg-red-600 px-3 py-1 rounded">+Loss</button>
                <button onClick={() => updatePlayer(player.name, { losses: Math.max(0, player.losses - 1) })} className="bg-red-900 px-3 py-1 rounded">-Loss</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 選手追加フォーム */}
      <div className="border border-gray-700 p-4 rounded mt-8 flex gap-4 items-center">
        <input
          type="text"
          placeholder="名前"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded text-white flex-1"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNewImage(e.target.files?.[0] || null)}
          className="text-white"
        />
        <button
          onClick={addPlayer}
          disabled={uploading}
          className="bg-yellow-500 px-4 py-2 rounded font-bold disabled:opacity-50"
        >
          {uploading ? "登録中..." : "追加"}
        </button>
      </div>
    </main>
  );
}