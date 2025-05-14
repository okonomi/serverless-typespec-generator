import type { AWS } from "@serverless/typescript"
import type Serverless from "serverless"

export type SLS = Serverless & { service: AWS }
