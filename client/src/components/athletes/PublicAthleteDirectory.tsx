"use client";
import React, { useEffect, useState } from "react";
import { FiSearch, FiMapPin, FiFilter } from "react-icons/fi";
import AthleteService from "@/services/athleteService";
import {
  Athlete,
  AthleteFilters,
  SPORTS,
  LIBERIA_COUNTIES,
} from "@/types/athlete";
import AthleteCardPublic from "./AthleteCardPublic";

export default function PublicAthleteDirectory() {
  const [search, setSearch] = useState("");
  // Default to show all sports/levels publicly so newly added athletes are visible
  const [sport, setSport] = useState("all");
  const [level, setLevel] = useState("all");
  const [county, setCounty] = useState("all");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filters: AthleteFilters = {
          search: search,
          sport: sport || "football",
          level: level || "all",
          county: county || "all",
          scoutingStatus: "all",
          position: "all",
          ageRange: {},
        };

        const res = await AthleteService.getAthletes(filters, {
          page: 1,
          pageSize: 100,
        });
        setAthletes(res.athletes);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [search, sport, level, county]);

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="bg-linear-to-r from-[#000054] to-[#1e1e8f] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Athlete Directory
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Discover talented athletes across Liberia
          </p>

          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search athletes..."
                className="w-full px-6 py-4 pr-12 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FiSearch className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#00124f] text-white">
              N
            </span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                All Athletes
              </h2>
              <p className="text-sm text-gray-500">
                Filter and search athletes by sport, level, and location
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="bg-white rounded-full p-2 flex items-center gap-2 shadow-sm">
              <FiFilter className="text-gray-500" />
              <select
                className="bg-transparent outline-none"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
              >
                {["all", ...SPORTS].map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-full p-2 flex items-center gap-2 shadow-sm">
              <select
                className="bg-transparent outline-none"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="grassroots">Grassroots</option>
                <option value="semi-pro">Semi-Pro</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            <div className="bg-white rounded-full p-2 flex items-center gap-2 shadow-sm">
              <FiMapPin className="text-gray-500" />
              <select
                className="bg-transparent outline-none"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
              >
                <option value="all">All Locations</option>
                {LIBERIA_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#000054]"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Unable to load athletes
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <p className="text-gray-500">
              If this is a permissions issue, please sign in as an admin or
              adjust Firestore rules.
            </p>
          </div>
        ) : athletes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-6xl mb-4">⚽</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No athletes found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {athletes.map((a) => (
              <AthleteCardPublic key={a.id} athlete={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
