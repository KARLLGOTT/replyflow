import React, { useEffect } from "react";

export default function ApiDocs() {
  useEffect(() => {
    // Редирект на Swagger бекенда
    window.location.href = "https://replyflow-production-313e.up.railway.app";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 flex items-center justify-center">
      <div className="text-white text-xl">Перенаправление на документацию API...</div>
    </div>
  );
}