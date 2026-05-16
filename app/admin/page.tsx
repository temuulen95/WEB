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
  const [deleteTarget, setDeleteTarget] = useState("");

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

  const deletePlayer = async () => {
    if (!deleteTarget) return;
    const confirmed = window.confirm(`${deleteTarget}を削除しますか？`);
    if (!confirmed) return;

    await supabase.from("players").delete().eq("name", deleteTarget);
    setPlayers((prev) => prev.filter((p) => p.name !== deleteTarget));
    setDeleteTarget("");
  };

  const getImage = (player: Player) => {
    if (player.image && player.image.startsWith("http")) return player.image;
    return imageMap[player.name] || "/file.svg";
  };

  return (
    <main className="min-h-screen bg-black text-white p-1">
      <h1 className="text-lg font-bold mb-2 text-center">⚙️ Admin</h1>

      <div className="grid grid-cols-2 gap-1">
        {players.map((player) => (
          <div
            key={player.name}
            className="border border-gray-700 rounded p-1 flex flex-col items-center gap-1"
          >
            <img
              src={getImage(player)}
              alt={player.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="font-bold text-xs">{player.name}</div>
            <div className="text-xs text-gray-400">
              {player.points}pts W:{player.wins} L:{player.losses}
            </div>
            <div className="grid grid-cols-3 gap-1 w-full">
              <button onClick={() => updatePlayer(player.name, { points: player.points + 1 })} className="bg-blue-600 py-1 rounded text-xs">+Pt</button>
              <button onClick={() => updatePlayer(player.name, { wins: player.wins + 1 })} className="bg-green-600 py-1 rounded text-xs">+W</button>
              <button onClick={() => updatePlayer(player.name, { losses: player.losses + 1 })} className="bg-red-600 py-1 rounded text-xs">+L</button>
              <button onClick={() => updatePlayer(player.name, { points: Math.max(0, player.points - 1) })} className="bg-gray-600 py-1 rounded text-xs">-Pt</button>
              <button onClick={() => updatePlayer(player.name, { wins: Math.max(0, player.wins - 1) })} className="bg-green-900 py-1 rounded text-xs">-W</button>
              <button onClick={() => updatePlayer(player.name, { losses: Math.max(0, player.losses - 1) })} className="bg-red-900 py-1 rounded text-xs">-L</button>
            </div>
          </div>
        ))}
      </div>

      {/* 選手追加フォーム */}
      <div className="border border-gray-700 rounded p-4 mt-4 flex flex-col gap-3">
        <h2 className="font-bold text-lg">選手追加</h2>
        <input
          type="text"
          placeholder="名前"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded text-white w-full"
        />
        <label className="bg-gray-700 px-3 py-2 rounded text-center cursor-pointer">
          📷 写真を撮る / 選ぶ
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setNewImage(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>
        {newImage && (
          <div className="text-xs text-gray-400 text-center">{newImage.name}</div>
        )}
        <button
          onClick={addPlayer}
          disabled={uploading}
          className="bg-yellow-500 px-4 py-3 rounded font-bold text-black disabled:opacity-50 w-full"
        >
          {uploading ? "登録中..." : "追加"}
        </button>
      </div>

      {/* 選手削除フォーム */}
      <div className="border border-red-900 rounded p-4 mt-4 flex flex-col gap-3">
        <h2 className="font-bold text-lg text-red-400">選手削除</h2>
        <select
          value={deleteTarget}
          onChange={(e) => setDeleteTarget(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded text-white w-full"
        >
          <option value="">選手を選ぶ</option>
          {players.map((p) => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={deletePlayer}
          disabled={!deleteTarget}
          className="bg-red-600 px-4 py-3 rounded font-bold disabled:opacity-50 w-full"
        >
          削除
        </button>
      </div>
    </main>
  );
}