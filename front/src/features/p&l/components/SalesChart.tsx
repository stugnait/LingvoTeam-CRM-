"use client"

import React, { useMemo } from "react"
import dynamic from "next/dynamic"
import { SalesChartResponse } from "../types"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

const formatNumber = (num: number) => num.toLocaleString('uk-UA')

const commonResponsiveConfig = [
    {
        breakpoint: 768,
        options: {
            yaxis: {
                title: { text: '' },
                labels: { formatter: (val: number) => val !== null ? parseFloat(val.toFixed(2)) : val }
            },
            grid: { padding: { left: 10, right: 10, top: 10, bottom: 0 } },
            xaxis: { labels: { style: { fontSize: '10px' } } }
        }
    },
    {
        breakpoint: 480,
        options: {
            chart: { toolbar: { show: false } },
            legend: { fontSize: '10px', itemMargin: { horizontal: 5, vertical: 2 } },
            markers: { size: 3, hover: { size: 5 } },
            grid: { padding: { left: 5, right: 5, top: 10, bottom: 0 } },
            xaxis: { labels: { rotate: -45, style: { fontSize: '9px' } } },
            yaxis: {
                labels: {
                    style: { fontSize: '9px' },
                    formatter: (val: number) => val !== null ? parseFloat(val.toFixed(2)) : val
                }
            }
        }
    }
]

interface SalesChartProps {
    data: SalesChartResponse | null
    loading?: boolean
}

export function SalesChart({ data, loading }: SalesChartProps) {

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { labels: [], seriesData: [] }

        // Просто сортуємо по даті і розкладаємо на масиви для графіка
        const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        const labels = sortedData.map(item => item.date.split('T')[0])
        const seriesData = sortedData.map(item => parseFloat(item.daily_revenue.toString()))

        return { labels, seriesData }
    }, [data])

    if (loading) {
        return <div className="flex h-[220px] sm:h-[350px] items-center justify-center text-muted-foreground">Завантаження графіка...</div>
    }

    if (!data || data.length === 0) {
        return <div className="flex h-[220px] sm:h-[350px] items-center justify-center text-muted-foreground">Немає даних для відображення</div>
    }

    const options: any = {
        chart: {
            type: 'area',
            toolbar: { show: true },
            zoom: { enabled: true, allowMouseWheelZoom: false },
            animations: { enabled: true }
        },
        colors: ['#10b981'],
        stroke: {
            curve: 'smooth',
            width: 3
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.05,
                stops: [0, 100]
            }
        },
        markers: {
            size: 5,
            colors: ['#10b981'],
            strokeColors: '#ffffff',
            strokeWidth: 2,
            hover: { size: 7 }
        },
        grid: {
            borderColor: '#e0e0e0',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: true } }
        },
        xaxis: {
            categories: chartData.labels,
            labels: {
                rotate: -45,
                style: { colors: "#6b7280", fontSize: '11px', fontFamily: 'Inter, sans-serif' }
            },
            title: {
                text: 'Дні',
                style: { color: "#6b7280", fontSize: '12px' }
            }
        },
        yaxis: {
            labels: {
                formatter: (val: number) => formatNumber(val),
                style: { colors: "#6b7280", fontSize: '11px' }
            },
            title: {
                text: "Обсяг (Сума)",
                style: { color: "#6b7280", fontSize: '12px' }
            }
        },
        tooltip: {
            shared: true,
            intersect: false,
            theme: 'light',
            y: {
                formatter: (val: number) => val !== null ? `$${formatNumber(val)}` : '-'
            }
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        responsive: commonResponsiveConfig
    }

    const series = [{
        name: 'Обсяг продажів',
        data: chartData.seriesData
    }]

    return (
        <div className="w-full h-[220px] sm:h-[350px]">
            <Chart options={options} series={series} type="area" height="100%" width="100%" />
        </div>
    )
}