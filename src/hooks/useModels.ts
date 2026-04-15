import { useEffect, useState } from "react";
import { message } from "antd";
import { supabase } from "../lib/supabase";
import type { ModelRow } from "../lib/database.types";

export function useModels() {
  const [models, setModels] = useState<ModelRow[]>([]);

  const loadModels = async () => {
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      message.error(error.message);
      return;
    }
    setModels(data ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialModels = async () => {
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        message.error(error.message);
      } else {
        setModels(data ?? []);
      }
    };

    void loadInitialModels();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    models,
    setModels,
    loadModels,
  };
}
