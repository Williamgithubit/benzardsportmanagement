"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FiClock, FiCalendar } from "react-icons/fi";
import AthleteService from "@/services/athleteService";
import { Athlete } from "@/types/athlete";
import { notFound } from "next/navigation";
import EnquiryService from "@/services/enquiryService";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert,
  type AlertColor,
} from "@mui/material";

interface Props {
  params: Promise<{ id: string }>;
}

export default function AthleteProfilePage({ params }: Props) {
  // Next.js may provide `params` as a Promise in newer versions.
  // If `React.use` is available (Next.js/React helper to unwrap async props), use it.
  // Otherwise fall back to direct access for compatibility.
  const resolvedParams =
    typeof (React as any).use === "function"
      ? (React as any).use(params)
      : params;
  const { id } = resolvedParams as { id: string };
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<AlertColor>("success");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const a = await AthleteService.getAthleteById(id);
        if (!a) {
          setAthlete(null);
        } else {
          setAthlete(a);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (!loading && !athlete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Athlete not found
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {athlete && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {athlete.name}
                </h1>
                <div className="text-gray-600 mb-6">{athlete.bio}</div>

                {/* Gallery */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {(athlete.media || []).slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="relative w-full h-44 bg-gray-100 rounded overflow-hidden"
                    >
                      {m.type === "photo" ? (
                        <Image
                          src={m.url}
                          alt={m.caption || athlete.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <video
                          src={m.url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Stats</h2>
                  {athlete.stats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(athlete.stats).map(([k, v]) => (
                        <div key={k} className="text-sm text-gray-700">
                          <div className="font-medium">
                            {k.replace(/([A-Z])/g, " $1")}
                          </div>
                          <div className="text-lg font-bold">{v ?? "—"}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">No stats available.</div>
                  )}
                </div>

                {/* Videos */}
                {athlete.media &&
                  athlete.media.some((m) => m.type === "video") && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                      <h2 className="text-xl font-semibold mb-4">Videos</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {athlete.media
                          .filter((m) => m.type === "video")
                          .map((v) => (
                            <video
                              key={v.id}
                              src={v.url}
                              controls
                              className="w-full h-48 object-cover rounded"
                            />
                          ))}
                      </div>
                    </div>
                  )}
              </div>

              <aside className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 relative rounded-full overflow-hidden">
                    <Image
                      src={
                        athlete.media && athlete.media[0]
                          ? athlete.media[0].url
                          : "/assets/1.jpg"
                      }
                      alt={athlete.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Age</div>
                    <div className="font-semibold">{athlete.age ?? "—"}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500">Position</div>
                  <div className="font-semibold">{athlete.position ?? "—"}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-semibold">
                    {athlete.county ?? athlete.location ?? "—"}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500">Sport</div>
                  <div className="font-semibold">{athlete.sport}</div>
                </div>

                <div className="mt-6">
                  <button
                    className="w-full bg-[#000054] text-white py-2 rounded-full"
                    onClick={() => setContactOpen(true)}
                  >
                    Contact/Enquire
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
      {/* Contact Dialog */}
      <Dialog open={contactOpen} onClose={() => setContactOpen(false)}>
        <DialogTitle>Contact about {athlete?.name}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            sx={{ mt: 1 }}
          />
          <TextField
            fullWidth
            label="Email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={contactSubmitting || !contactName}
            onClick={async () => {
              setContactSubmitting(true);
              try {
                await EnquiryService.createEnquiry({
                  athleteId: id,
                  name: contactName,
                  email: contactEmail,
                  phone: contactPhone,
                  message: contactMessage,
                });
                setContactOpen(false);
                // reset
                setContactName("");
                setContactEmail("");
                setContactPhone("");
                setContactMessage("");
                setSnackbarMessage("Enquiry sent — admins will be notified");
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
              } catch (err) {
                console.error(err);
                setSnackbarMessage("Failed to send enquiry");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
              } finally {
                setContactSubmitting(false);
              }
            }}
          >
            Send Enquiry
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
