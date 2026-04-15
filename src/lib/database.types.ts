export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string;
          user_id: string;
          asset: string;
          strategy_name: string;
          strategy_description: string | null;
          model_id: string | null;
          timeframe: string;
          direction: string;
          trade_status: string;
          start_date: string;
          end_date: string;
          initial_capital: number;
          gross_pnl: number | null;
          fee_amount: number | null;
          net_pnl: number | null;
          total_return: number | null;
          max_drawdown: number | null;
          win_rate: number | null;
          profit_factor: number | null;
          total_trades: number | null;
          sharpe_ratio: number | null;
          notes: string | null;
          no_trade_day: boolean;
          no_trade_reason: string | null;
          close_reason: string | null;
          equity_curve_url: string | null;
          equity_curve_urls: string[];
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          asset: string;
          strategy_name: string;
          strategy_description?: string | null;
          model_id?: string | null;
          timeframe: string;
          direction?: string;
          trade_status?: string;
          start_date: string;
          end_date: string;
          initial_capital: number;
          gross_pnl?: number | null;
          fee_amount?: number | null;
          net_pnl?: number | null;
          total_return?: number | null;
          max_drawdown?: number | null;
          win_rate?: number | null;
          profit_factor?: number | null;
          total_trades?: number | null;
          sharpe_ratio?: number | null;
          notes?: string | null;
          no_trade_day?: boolean;
          no_trade_reason?: string | null;
          close_reason?: string | null;
          equity_curve_url?: string | null;
          equity_curve_urls?: string[];
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          asset?: string;
          strategy_name?: string;
          strategy_description?: string | null;
          model_id?: string | null;
          timeframe?: string;
          direction?: string;
          trade_status?: string;
          start_date?: string;
          end_date?: string;
          initial_capital?: number;
          gross_pnl?: number | null;
          fee_amount?: number | null;
          net_pnl?: number | null;
          total_return?: number | null;
          max_drawdown?: number | null;
          win_rate?: number | null;
          profit_factor?: number | null;
          total_trades?: number | null;
          sharpe_ratio?: number | null;
          notes?: string | null;
          no_trade_day?: boolean;
          no_trade_reason?: string | null;
          close_reason?: string | null;
          equity_curve_url?: string | null;
          equity_curve_urls?: string[];
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trades_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "models";
            referencedColumns: ["id"];
          },
        ];
      };
      models: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TradeRow = Database["public"]["Tables"]["trades"]["Row"];
export type TradeInsert = Database["public"]["Tables"]["trades"]["Insert"];
export type ModelRow = Database["public"]["Tables"]["models"]["Row"];
export type ModelInsert = Database["public"]["Tables"]["models"]["Insert"];
