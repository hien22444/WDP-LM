import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";
const client = axios.create({ baseURL: API_URL });

class AIService {
  static async chatCompletion(messages) {
    try {
      // backend chat endpoint expects { message: string }
      let payload;
      if (typeof messages === "string") {
        payload = { message: messages };
      } else if (Array.isArray(messages)) {
        // pick the most recent user message if available
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const text =
          lastUser?.content || messages[messages.length - 1]?.content || "";
        payload = { message: text };
      } else {
        payload = { message: "" };
      }
      const response = await client.post("/ai/chat", payload);
      return response.data;
    } catch (error) {
      console.error("Error in AI chat completion:", error?.message || error);
      // If backend returned a structured error payload (fallback), return it so UI can handle
      if (error?.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async searchTutors(query) {
    try {
      const response = await client.post("/ai/search-tutors", { query });
      return response.data;
    } catch (error) {
      console.error("Error in AI tutor search:", error);
      throw error;
    }
  }
}

export default AIService;
