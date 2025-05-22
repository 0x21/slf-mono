/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tooltip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  AppWindow,
  CircleHelp,
  MonitorSmartphone,
  SquareArrowOutUpRight,
  Users,
} from "lucide-react";
import moment from "moment";
import pluralize from "pluralize";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import type { UserRole } from "@fulltemplate/auth/src/types";
import type { OnlineUser } from "@fulltemplate/socket";
import { RouterOutputs } from "@fulltemplate/api";

import type { ChartConfig } from "~/components/ui/chart";
import GenericEmpty from "~/components/common/GenericEmpty";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { CountAnimation } from "~/components/ui/count-animation";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import { Skeleton } from "~/components/ui/skeleton";
import { socket } from "~/lib/socket";
import { useTRPC } from "~/trpc/react";

const dailyActiveUsersChartConfig = {
  signIn: {
    label: "Users",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const signupsChartConfig = {
  signups: {
    label: "Sign Ups",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const failedAttemptsChartConfig = {
  attempts: {
    label: "Attempts",
    color: "#ef4444",
  },
} satisfies ChartConfig;

const retentionChartConfig = {
  retentionRate: {
    label: "Rate",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

type AppConfig = RouterOutputs["admin"]["getAppConfig"];

export default function Client({
  appConfig,
  userRole,
}: {
  appConfig: AppConfig;
  userRole: UserRole;
}) {
  const api = useTRPC();
  const [fromDate, setFromDate] = useState(
    moment(new Date()).subtract(13, "days").toISOString().slice(0, 10),
  );
  const [toDate, setToDate] = useState<string | undefined>(
    moment(new Date()).toISOString().slice(0, 10),
  );
  const { data, isLoading } = useQuery(
    api.admin.getDashboardData.queryOptions(),
  );

  const { data: retentionData, isLoading: isRetentionLoading } = useQuery(
    api.admin.getUserRetentions.queryOptions({
      fromDate: fromDate,
      toDate: toDate,
    }),
  );

  const { data: dailyActiveUsersData, isLoading: isDailyActiveUsersLoading } =
    useQuery(
      api.admin.getDailyActiveUsers.queryOptions({
        fromDate: fromDate,
        toDate: toDate,
      }),
    );

  const { data: signupsData, isLoading: isSignupsLoading } = useQuery(
    api.admin.getSignups.queryOptions({
      fromDate: fromDate,
      toDate: toDate,
    }),
  );

  const { data: failedAttemptsData, isLoading: isFailedAttemptsLoading } =
    useQuery(
      api.admin.getFailedAttempts.queryOptions({
        fromDate: fromDate,
        toDate: toDate,
      }),
    );

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const dailyActiveUsersChartData = useMemo(() => {
    if (!dailyActiveUsersData) {
      return [];
    }
    return dailyActiveUsersData.map(
      (item: { createdAt: string; count: number }) => ({
        createdAt: new Date(item.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        }),
        signIn: item.count,
      }),
    );
  }, [dailyActiveUsersData]);

  const maxSignIns = useMemo(() => {
    if (!dailyActiveUsersData) {
      return 0;
    }
    return Math.max(...dailyActiveUsersData.map((item) => item.count));
  }, [dailyActiveUsersData]);

  const retentionChartData = useMemo(() => {
    if (!retentionData) {
      return [];
    }
    return retentionData.map(
      (item: { date: string; retentionRate: number; activeUsers: number }) => ({
        date: new Date(item.date).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        }),
        retentionRate: item.retentionRate,
        activeUsers: item.activeUsers,
      }),
    );
  }, [retentionData]);

  const signupsChartData = useMemo(() => {
    if (!signupsData) {
      return [];
    }
    return signupsData.map((item: { createdAt: string; count: number }) => ({
      createdAt: new Date(item.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      }),
      signups: item.count,
    }));
  }, [signupsData]);

  const maxSignups = useMemo(() => {
    if (!signupsData) {
      return 0;
    }
    return Math.max(...signupsData.map((item) => item.count));
  }, [signupsData]);

  const failedAttemptsChartData = useMemo(() => {
    if (!failedAttemptsData) {
      return [];
    }
    return failedAttemptsData.map(
      (item: { createdAt: string; attempts: number }) => ({
        createdAt: new Date(item.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        }),
        attempts: item.attempts,
      }),
    );
  }, [failedAttemptsData]);

  const maxAttempts = useMemo(() => {
    if (!failedAttemptsData) {
      return 0;
    }
    return Math.max(...failedAttemptsData.map((item) => item.attempts));
  }, [failedAttemptsData]);

  const uniqueUserIds = useMemo(() => {
    return new Set(onlineUsers.map((user) => user.user?.userId)).size;
  }, [onlineUsers]);

  useEffect(() => {
    socket.on("onlineUsersData", (data) => {
      if (appConfig.isSuperadminHidden && userRole === "admin") {
        data.users = data.users.filter(
          (user) => user.user?.role !== "superadmin",
        );
      }
      setOnlineUsers(data.users);
    });

    return () => {
      socket.off("onlineUsersData");
    };
  }, [appConfig, userRole]);

  return (
    <div>
      <div className="flex h-8 items-center justify-between">
        <h2 className="text-foreground text-xl font-semibold">Dashboard</h2>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-4">
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Users className="text-muted-foreground -mt-0.5 h-4 w-4" />
            <CardTitle className="ml-1 text-sm font-medium">
              Total Users
            </CardTitle>
            <Link href={`/admin/users`} className="ml-auto">
              <div className="-m-0.5 p-0.5 sm:hidden">
                <SquareArrowOutUpRight className="text-muted-foreground size-4" />
              </div>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div>
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="mt-1 h-4 w-32 rounded-md" />
              </div>
            )}
            {!isLoading && data && (
              <>
                <div className="flex text-xl font-bold">
                  <CountAnimation
                    number={data.userCount}
                    className="mr-1 text-xl font-bold"
                  />

                  {pluralize("user", data.userCount)}
                </div>
                <div className="text-muted-foreground flex items-center text-xs">
                  <div className="-mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  <span className="ml-1 flex">
                    <CountAnimation number={uniqueUserIds} className="mr-1" />
                    online,
                  </span>
                  <div className="-mt-0.5 ml-1.5 h-1.5 w-1.5 rounded-full bg-red-500"></div>
                  <span className="ml-1 flex">
                    <CountAnimation
                      number={data.userCount - uniqueUserIds}
                      className="mr-1"
                    />
                    offline
                  </span>{" "}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <MonitorSmartphone className="text-muted-foreground -mt-0.5 h-4 w-4" />
            <CardTitle className="ml-1 text-sm font-medium">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div>
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="mt-1 h-4 w-32 rounded-md" />
              </div>
            )}
            {!isLoading && data && (
              <>
                <div className="flex text-xl font-bold">
                  <CountAnimation number={uniqueUserIds} className="mr-1" />
                  {pluralize("session", uniqueUserIds)}
                </div>
                <div className="text-muted-foreground flex items-center text-xs">
                  {/* <div className="-mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500"></div> */}
                  <span className="ml-0.5 flex">
                    <CountAnimation
                      number={onlineUsers.length}
                      className="mr-1"
                    />
                    tabs open
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <AppWindow className="text-muted-foreground -mt-0.5 h-4 w-4" />
            <CardTitle className="ml-1 text-sm font-medium">Signups</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div>
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="mt-1 h-4 w-32 rounded-md" />
              </div>
            )}
            {!isLoading && data && (
              <>
                <div className="flex text-xl font-bold">
                  <CountAnimation
                    number={data.lastMonthSignups}
                    className="mr-1"
                  />
                  signup
                </div>
                <p className="text-muted-foreground text-xs">
                  {data.lastTwoMonthSignupDiff > 0 && (
                    <span className="flex">
                      +
                      <CountAnimation
                        number={data.lastTwoMonthSignupDiff}
                        className="mr-1"
                      />
                      since last month
                    </span>
                  )}
                  {data.lastTwoMonthSignupDiff < 0 && (
                    <span className="flex">
                      <CountAnimation
                        number={Math.abs(data.lastTwoMonthSignupDiff)}
                        className="mr-1"
                      />
                      since last month
                    </span>
                  )}
                  {data.lastTwoMonthSignupDiff === 0 && (
                    <>
                      <span className="flex sm:hidden">No change</span>
                      <span className="hidden sm:flex">
                        No change since last month
                      </span>
                    </>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-foreground text-xl font-semibold">Charts</h2>
        <DateRangePicker
          onUpdate={(values) => {
            const from = moment(values.range.from).format("YYYY-MM-DD");
            const to = values.range.to
              ? moment(values.range.to).format("YYYY-MM-DD")
              : undefined;

            setFromDate(from);
            setToDate(to);
          }}
          initialDateFrom={fromDate}
          initialDateTo={toDate}
          align="start"
          showCompare={false}
          className="h-8 w-fit"
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="col-span-2 flex w-full flex-col">
          <Card className="h-fit w-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                Daily Active Users
                <Tooltip
                  title="Unique users with a successful authentication or authorization activity."
                  placement="top"
                  arrow
                >
                  <CircleHelp className="text-muted-foreground ml-1.5 flex h-5 w-5" />
                </Tooltip>
              </CardTitle>
              <CardDescription>
                {isDailyActiveUsersLoading && <Skeleton className="h-5 w-32" />}
                {!isDailyActiveUsersLoading && (
                  <span className="flex">
                    Total Active User:
                    <CountAnimation
                      number={
                        dailyActiveUsersData?.reduce(
                          (sum, day) => sum + day.count,
                          0,
                        ) ?? 0
                      }
                      className="ml-1"
                    />
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent
              className={
                isDailyActiveUsersLoading ? "flex h-[300px]" : "flex h-full"
              }
            >
              {isDailyActiveUsersLoading && (
                <Skeleton className="h-full w-full" />
              )}
              {!isDailyActiveUsersLoading &&
                dailyActiveUsersChartData.length === 0 && (
                  <div className="flex h-fit w-full items-center justify-center p-6 pb-9 text-lg font-semibold sm:h-[300px]">
                    <GenericEmpty />
                  </div>
                )}
              {!isDailyActiveUsersLoading &&
                dailyActiveUsersChartData.length > 0 && (
                  <ChartContainer
                    config={dailyActiveUsersChartConfig}
                    className="h-fit w-full sm:h-[300px]"
                  >
                    <LineChart
                      accessibilityLayer
                      data={dailyActiveUsersChartData}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="createdAt"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          });
                        }}
                      />
                      <YAxis
                        dataKey="signIn"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={[0, Math.max(4, Math.ceil(maxSignIns * 1.5))]}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Line
                        dataKey="signIn"
                        type="linear"
                        stroke="var(--color-signIn)"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          fill: "var(--color-signIn)",
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
            </CardContent>
          </Card>
        </div>
        <div className="col-span-2 flex w-full flex-col md:col-span-1">
          <Card className="h-fit w-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                User Retention
                <Tooltip
                  title="Active users divided by all users during the given time period."
                  placement="top"
                  arrow
                >
                  <CircleHelp className="text-muted-foreground ml-1.5 flex h-5 w-5" />
                </Tooltip>
              </CardTitle>
              <CardDescription>
                {isRetentionLoading && <Skeleton className="h-5 w-32" />}

                {!isRetentionLoading && retentionChartData.length >= 0 && (
                  <span className="flex">
                    Average Rate: %
                    <CountAnimation
                      number={
                        retentionData
                          ? retentionData.reduce(
                              (sum, day) => sum + (day.retentionRate || 0),
                              0,
                            ) / retentionData.length
                          : 0
                      }
                    />
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent
              className={isRetentionLoading ? "flex h-[300px]" : "flex h-full"}
            >
              {isRetentionLoading && <Skeleton className="h-full w-full" />}
              {!isRetentionLoading && retentionChartData.length === 0 && (
                <div className="flex h-fit w-full items-center justify-center p-6 pb-9 text-lg font-semibold sm:h-[300px]">
                  <GenericEmpty />
                </div>
              )}
              {!isRetentionLoading && retentionChartData.length > 0 && (
                <ChartContainer
                  config={retentionChartConfig}
                  className="h-fit w-full sm:h-[300px]"
                >
                  <LineChart accessibilityLayer data={retentionChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        });
                      }}
                    />
                    <YAxis
                      dataKey="retentionRate"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      domain={[0, 100]}
                      ticks={[0, 20, 40, 60, 80, 100]}
                      tickFormatter={(value) => `%${value}`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Line
                      dataKey="retentionRate"
                      type="linear"
                      stroke="var(--color-retentionRate)"
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: "var(--color-retentionRate)",
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="col-span-2 flex w-full flex-col md:col-span-1">
          <Card className="h-fit w-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                Signups
                <Tooltip
                  title="The count of successful sign up events."
                  placement="top"
                  arrow
                >
                  <CircleHelp className="text-muted-foreground ml-1.5 flex h-5 w-5" />
                </Tooltip>
              </CardTitle>
              <CardDescription>
                {isSignupsLoading && <Skeleton className="h-5 w-32" />}
                {!isSignupsLoading && signupsChartData.length >= 0 && (
                  <span className="flex">
                    Total Signups:
                    <CountAnimation
                      number={
                        signupsData?.reduce(
                          (sum, signup) => sum + signup.count,
                          0,
                        ) || 0
                      }
                      className="ml-1"
                    />
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent
              className={isSignupsLoading ? "flex h-[300px]" : "flex h-full"}
            >
              {isSignupsLoading && <Skeleton className="h-full w-full" />}
              {!isSignupsLoading && signupsChartData.length === 0 && (
                <div className="flex h-fit w-full items-center justify-center p-6 pb-9 text-lg font-semibold sm:h-[300px]">
                  <GenericEmpty />
                </div>
              )}
              {!isSignupsLoading && signupsChartData.length > 0 && (
                <ChartContainer
                  config={signupsChartConfig}
                  className="h-fit w-full sm:h-[300px]"
                >
                  <LineChart accessibilityLayer data={signupsChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="createdAt"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        });
                      }}
                    />
                    <YAxis
                      dataKey="signups"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      domain={[0, Math.ceil(Math.max(maxSignups * 1.5, 4))]}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Line
                      dataKey="signups"
                      type="linear"
                      stroke="var(--color-signups)"
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: "var(--color-signups)",
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="col-span-2 flex w-full flex-col">
          <Card className="h-fit w-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                Failed Login Attempts
                <Tooltip
                  title="The count of failed login events."
                  placement="top"
                  arrow
                >
                  <CircleHelp className="text-muted-foreground ml-1.5 flex h-5 w-5" />
                </Tooltip>
              </CardTitle>
              <CardDescription>
                {isFailedAttemptsLoading && <Skeleton className="h-5 w-32" />}
                {!isFailedAttemptsLoading &&
                  failedAttemptsChartData.length >= 0 && (
                    <span className="flex">
                      Total Attempts:
                      <CountAnimation
                        number={
                          failedAttemptsData?.reduce(
                            (sum, attempt) => sum + attempt.attempts,
                            0,
                          ) || 0
                        }
                        className="ml-1"
                      />
                    </span>
                  )}
              </CardDescription>
            </CardHeader>
            <CardContent
              className={
                isFailedAttemptsLoading ? "flex h-[300px]" : "flex h-full"
              }
            >
              {isFailedAttemptsLoading && (
                <Skeleton className="h-full w-full" />
              )}
              {!isFailedAttemptsLoading &&
                failedAttemptsChartData.length === 0 && (
                  <div className="flex h-fit w-full items-center justify-center p-6 pb-9 text-lg font-semibold sm:h-[300px]">
                    <GenericEmpty />
                  </div>
                )}
              {!isFailedAttemptsLoading &&
                failedAttemptsChartData.length > 0 && (
                  <ChartContainer
                    config={failedAttemptsChartConfig}
                    className="h-fit w-full sm:h-[300px]"
                  >
                    <LineChart
                      accessibilityLayer
                      data={failedAttemptsChartData}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="createdAt"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          });
                        }}
                      />
                      <YAxis
                        dataKey="attempts"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={[0, Math.max(4, Math.ceil(maxAttempts * 1.5))]}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Line
                        dataKey="attempts"
                        type="linear"
                        stroke="var(--color-attempts)"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          fill: "var(--color-attempts)",
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
