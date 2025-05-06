import type Serverless from "serverless"
import type { AWS } from "@serverless/typescript"

export type SLS = Serverless & { service: AWS }
