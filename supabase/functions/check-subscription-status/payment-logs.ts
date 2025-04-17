
export async function checkPaymentLogs(supabase: any, userId: string): Promise<boolean> {
  try {
    console.log(`[CHECK-SUB] Checking payment logs for user: ${userId}`);

    // Look for recent payment logs
    const { data: paymentLogs, error } = await supabase
      .from("payment_logs")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[CHECK-SUB] Error checking payment logs:", error);
      return false;
    }

    if (paymentLogs && paymentLogs.length > 0) {
      console.log("[CHECK-SUB] Found payment log:", paymentLogs[0]);

      // Update profile with premium status
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30); // Default 30 day fallback

      await supabase
        .from("profiles")
        .update({
          is_premium: true,
          subscription_status: "active",
          subscription_expiry: defaultExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      return true;
    }

    console.log("[CHECK-SUB] No payment logs found for user");
    return false;
  } catch (error) {
    console.error("[CHECK-SUB] Error in checkPaymentLogs:", error);
    return false;
  }
}
