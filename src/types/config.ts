import { z } from "zod";
import { AccountEntrySchema } from "./fabric.js";

export const AccountsFileSchema = z.object({
  accounts: z.array(AccountEntrySchema),
});
export type AccountsFile = z.infer<typeof AccountsFileSchema>;
