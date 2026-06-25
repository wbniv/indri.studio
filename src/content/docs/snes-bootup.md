---
title: "SNES bootup sequence"
summary: "What happens between power-on and main() on the SNES — reset vector, native-mode switch, and crt0 init."
app: "llvm-mos-65816"
sourceRepo: "llvm-mos-65816"
sourceCommit: "9c65ae7"
order: 4
---


How a `snes` / `snes-far` ROM goes from power-on to `main()`. This is a **reference** for the existing
behavior; the *why* of the native-mode design lives in the plans linked at the end. Source of truth:
`platforms/snes/crt0.c`, `platforms/snes/link.ld`,
`platforms/snes/header.s`, and the common chain merged via
`platforms/snes/CMakeLists.txt`.

## TL;DR

The 65816 powers on in **6502-emulation mode**, reads the **emulation RESET vector at `$FFFC`** → `_start`
(= the start of `.text` = `.init.50`). The crt0 preamble switches to **65816 native mode** and pins a known
machine contract (E/M/X/SP/DBR/DP), then the **common init chain** (`.init.100` → `.200` → `.300`) sets up the
soft stack, copies `.data`, clears `.bss`, and runs constructors, then `.call_main` calls `main()`. On the
SNES there is no OS to return to, so a return from `main()` lands in an infinite **exit loop**.

## The whole sequence at a glance

<div class="mermaid-diagram" data-mermaid-b64="PHN2ZyBpZD0ibWVybWFpZC1zdmciIHdpZHRoPSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJmbG93Y2hhcnQiIHN0eWxlPSJtYXgtd2lkdGg6IDI3NnB4OyIgdmlld0JveD0iMCAwIDI3NiAxMzgyIiByb2xlPSJncmFwaGljcy1kb2N1bWVudCBkb2N1bWVudCIgYXJpYS1yb2xlZGVzY3JpcHRpb249ImZsb3djaGFydC12MiIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxzdHlsZSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCI+QGltcG9ydCB1cmwoImh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2ZvbnQtYXdlc29tZS82LjcuMi9jc3MvYWxsLm1pbi5jc3MiKTs8L3N0eWxlPjxzdHlsZT4jbWVybWFpZC1zdmd7Zm9udC1mYW1pbHk6InRyZWJ1Y2hldCBtcyIsdmVyZGFuYSxhcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZToxNnB4O2ZpbGw6I2NjYzt9QGtleWZyYW1lcyBlZGdlLWFuaW1hdGlvbi1mcmFtZXtmcm9te3N0cm9rZS1kYXNob2Zmc2V0OjA7fX1Aa2V5ZnJhbWVzIGRhc2h7dG97c3Ryb2tlLWRhc2hvZmZzZXQ6MDt9fSNtZXJtYWlkLXN2ZyAuZWRnZS1hbmltYXRpb24tc2xvd3tzdHJva2UtZGFzaGFycmF5OjksNSFpbXBvcnRhbnQ7c3Ryb2tlLWRhc2hvZmZzZXQ6OTAwO2FuaW1hdGlvbjpkYXNoIDUwcyBsaW5lYXIgaW5maW5pdGU7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7fSNtZXJtYWlkLXN2ZyAuZWRnZS1hbmltYXRpb24tZmFzdHtzdHJva2UtZGFzaGFycmF5OjksNSFpbXBvcnRhbnQ7c3Ryb2tlLWRhc2hvZmZzZXQ6OTAwO2FuaW1hdGlvbjpkYXNoIDIwcyBsaW5lYXIgaW5maW5pdGU7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7fSNtZXJtYWlkLXN2ZyAuZXJyb3ItaWNvbntmaWxsOiNhNDQxNDE7fSNtZXJtYWlkLXN2ZyAuZXJyb3ItdGV4dHtmaWxsOiNkZGQ7c3Ryb2tlOiNkZGQ7fSNtZXJtYWlkLXN2ZyAuZWRnZS10aGlja25lc3Mtbm9ybWFse3N0cm9rZS13aWR0aDoxcHg7fSNtZXJtYWlkLXN2ZyAuZWRnZS10aGlja25lc3MtdGhpY2t7c3Ryb2tlLXdpZHRoOjMuNXB4O30jbWVybWFpZC1zdmcgLmVkZ2UtcGF0dGVybi1zb2xpZHtzdHJva2UtZGFzaGFycmF5OjA7fSNtZXJtYWlkLXN2ZyAuZWRnZS10aGlja25lc3MtaW52aXNpYmxle3N0cm9rZS13aWR0aDowO2ZpbGw6bm9uZTt9I21lcm1haWQtc3ZnIC5lZGdlLXBhdHRlcm4tZGFzaGVke3N0cm9rZS1kYXNoYXJyYXk6Mzt9I21lcm1haWQtc3ZnIC5lZGdlLXBhdHRlcm4tZG90dGVke3N0cm9rZS1kYXNoYXJyYXk6Mjt9I21lcm1haWQtc3ZnIC5tYXJrZXJ7ZmlsbDpsaWdodGdyZXk7c3Ryb2tlOmxpZ2h0Z3JleTt9I21lcm1haWQtc3ZnIC5tYXJrZXIuY3Jvc3N7c3Ryb2tlOmxpZ2h0Z3JleTt9I21lcm1haWQtc3ZnIHN2Z3tmb250LWZhbWlseToidHJlYnVjaGV0IG1zIix2ZXJkYW5hLGFyaWFsLHNhbnMtc2VyaWY7Zm9udC1zaXplOjE2cHg7fSNtZXJtYWlkLXN2ZyBwe21hcmdpbjowO30jbWVybWFpZC1zdmcgLmxhYmVse2ZvbnQtZmFtaWx5OiJ0cmVidWNoZXQgbXMiLHZlcmRhbmEsYXJpYWwsc2Fucy1zZXJpZjtjb2xvcjojY2NjO30jbWVybWFpZC1zdmcgLmNsdXN0ZXItbGFiZWwgdGV4dHtmaWxsOiNGOUZGRkU7fSNtZXJtYWlkLXN2ZyAuY2x1c3Rlci1sYWJlbCBzcGFue2NvbG9yOiNGOUZGRkU7fSNtZXJtYWlkLXN2ZyAuY2x1c3Rlci1sYWJlbCBzcGFuIHB7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDt9I21lcm1haWQtc3ZnIC5sYWJlbCB0ZXh0LCNtZXJtYWlkLXN2ZyBzcGFue2ZpbGw6I2NjYztjb2xvcjojY2NjO30jbWVybWFpZC1zdmcgLm5vZGUgcmVjdCwjbWVybWFpZC1zdmcgLm5vZGUgY2lyY2xlLCNtZXJtYWlkLXN2ZyAubm9kZSBlbGxpcHNlLCNtZXJtYWlkLXN2ZyAubm9kZSBwb2x5Z29uLCNtZXJtYWlkLXN2ZyAubm9kZSBwYXRoe2ZpbGw6IzFmMjAyMDtzdHJva2U6I2NjYztzdHJva2Utd2lkdGg6MXB4O30jbWVybWFpZC1zdmcgLnJvdWdoLW5vZGUgLmxhYmVsIHRleHQsI21lcm1haWQtc3ZnIC5ub2RlIC5sYWJlbCB0ZXh0LCNtZXJtYWlkLXN2ZyAuaW1hZ2Utc2hhcGUgLmxhYmVsLCNtZXJtYWlkLXN2ZyAuaWNvbi1zaGFwZSAubGFiZWx7dGV4dC1hbmNob3I6bWlkZGxlO30jbWVybWFpZC1zdmcgLm5vZGUgLmthdGV4IHBhdGh7ZmlsbDojMDAwO3N0cm9rZTojMDAwO3N0cm9rZS13aWR0aDoxcHg7fSNtZXJtYWlkLXN2ZyAucm91Z2gtbm9kZSAubGFiZWwsI21lcm1haWQtc3ZnIC5ub2RlIC5sYWJlbCwjbWVybWFpZC1zdmcgLmltYWdlLXNoYXBlIC5sYWJlbCwjbWVybWFpZC1zdmcgLmljb24tc2hhcGUgLmxhYmVse3RleHQtYWxpZ246Y2VudGVyO30jbWVybWFpZC1zdmcgLm5vZGUuY2xpY2thYmxle2N1cnNvcjpwb2ludGVyO30jbWVybWFpZC1zdmcgLnJvb3QgLmFuY2hvciBwYXRoe2ZpbGw6bGlnaHRncmV5IWltcG9ydGFudDtzdHJva2Utd2lkdGg6MDtzdHJva2U6bGlnaHRncmV5O30jbWVybWFpZC1zdmcgLmFycm93aGVhZFBhdGh7ZmlsbDpsaWdodGdyZXk7fSNtZXJtYWlkLXN2ZyAuZWRnZVBhdGggLnBhdGh7c3Ryb2tlOmxpZ2h0Z3JleTtzdHJva2Utd2lkdGg6Mi4wcHg7fSNtZXJtYWlkLXN2ZyAuZmxvd2NoYXJ0LWxpbmt7c3Ryb2tlOmxpZ2h0Z3JleTtmaWxsOm5vbmU7fSNtZXJtYWlkLXN2ZyAuZWRnZUxhYmVse2JhY2tncm91bmQtY29sb3I6aHNsKDAsIDAlLCAzNC40MTE3NjQ3MDU5JSk7dGV4dC1hbGlnbjpjZW50ZXI7fSNtZXJtYWlkLXN2ZyAuZWRnZUxhYmVsIHB7YmFja2dyb3VuZC1jb2xvcjpoc2woMCwgMCUsIDM0LjQxMTc2NDcwNTklKTt9I21lcm1haWQtc3ZnIC5lZGdlTGFiZWwgcmVjdHtvcGFjaXR5OjAuNTtiYWNrZ3JvdW5kLWNvbG9yOmhzbCgwLCAwJSwgMzQuNDExNzY0NzA1OSUpO2ZpbGw6aHNsKDAsIDAlLCAzNC40MTE3NjQ3MDU5JSk7fSNtZXJtYWlkLXN2ZyAubGFiZWxCa2d7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDg3Ljc1LCA4Ny43NSwgODcuNzUsIDAuNSk7fSNtZXJtYWlkLXN2ZyAuY2x1c3RlciByZWN0e2ZpbGw6aHNsKDE4MCwgMS41ODczMDE1ODczJSwgMjguMzUyOTQxMTc2NSUpO3N0cm9rZTpyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMjUpO3N0cm9rZS13aWR0aDoxcHg7fSNtZXJtYWlkLXN2ZyAuY2x1c3RlciB0ZXh0e2ZpbGw6I0Y5RkZGRTt9I21lcm1haWQtc3ZnIC5jbHVzdGVyIHNwYW57Y29sb3I6I0Y5RkZGRTt9I21lcm1haWQtc3ZnIGRpdi5tZXJtYWlkVG9vbHRpcHtwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmNlbnRlcjttYXgtd2lkdGg6MjAwcHg7cGFkZGluZzoycHg7Zm9udC1mYW1pbHk6InRyZWJ1Y2hldCBtcyIsdmVyZGFuYSxhcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZToxMnB4O2JhY2tncm91bmQ6aHNsKDIwLCAxLjU4NzMwMTU4NzMlLCAxMi4zNTI5NDExNzY1JSk7Ym9yZGVyOjFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMjUpO2JvcmRlci1yYWRpdXM6MnB4O3BvaW50ZXItZXZlbnRzOm5vbmU7ei1pbmRleDoxMDA7fSNtZXJtYWlkLXN2ZyAuZmxvd2NoYXJ0VGl0bGVUZXh0e3RleHQtYW5jaG9yOm1pZGRsZTtmb250LXNpemU6MThweDtmaWxsOiNjY2M7fSNtZXJtYWlkLXN2ZyByZWN0LnRleHR7ZmlsbDpub25lO3N0cm9rZS13aWR0aDowO30jbWVybWFpZC1zdmcgLmljb24tc2hhcGUsI21lcm1haWQtc3ZnIC5pbWFnZS1zaGFwZXtiYWNrZ3JvdW5kLWNvbG9yOmhzbCgwLCAwJSwgMzQuNDExNzY0NzA1OSUpO3RleHQtYWxpZ246Y2VudGVyO30jbWVybWFpZC1zdmcgLmljb24tc2hhcGUgcCwjbWVybWFpZC1zdmcgLmltYWdlLXNoYXBlIHB7YmFja2dyb3VuZC1jb2xvcjpoc2woMCwgMCUsIDM0LjQxMTc2NDcwNTklKTtwYWRkaW5nOjJweDt9I21lcm1haWQtc3ZnIC5pY29uLXNoYXBlIHJlY3QsI21lcm1haWQtc3ZnIC5pbWFnZS1zaGFwZSByZWN0e29wYWNpdHk6MC41O2JhY2tncm91bmQtY29sb3I6aHNsKDAsIDAlLCAzNC40MTE3NjQ3MDU5JSk7ZmlsbDpoc2woMCwgMCUsIDM0LjQxMTc2NDcwNTklKTt9I21lcm1haWQtc3ZnIC5sYWJlbC1pY29ue2Rpc3BsYXk6aW5saW5lLWJsb2NrO2hlaWdodDoxZW07b3ZlcmZsb3c6dmlzaWJsZTt2ZXJ0aWNhbC1hbGlnbjotMC4xMjVlbTt9I21lcm1haWQtc3ZnIC5ub2RlIC5sYWJlbC1pY29uIHBhdGh7ZmlsbDpjdXJyZW50Q29sb3I7c3Ryb2tlOnJldmVydDtzdHJva2Utd2lkdGg6cmV2ZXJ0O30jbWVybWFpZC1zdmcgOnJvb3R7LS1tZXJtYWlkLWZvbnQtZmFtaWx5OiJ0cmVidWNoZXQgbXMiLHZlcmRhbmEsYXJpYWwsc2Fucy1zZXJpZjt9PC9zdHlsZT48Zz48bWFya2VyIGlkPSJtZXJtYWlkLXN2Z19mbG93Y2hhcnQtdjItcG9pbnRFbmQiIGNsYXNzPSJtYXJrZXIgZmxvd2NoYXJ0LXYyIiB2aWV3Qm94PSIwIDAgMTAgMTAiIHJlZlg9IjUiIHJlZlk9IjUiIG1hcmtlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgbWFya2VyV2lkdGg9IjgiIG1hcmtlckhlaWdodD0iOCIgb3JpZW50PSJhdXRvIj48cGF0aCBkPSJNIDAgMCBMIDEwIDUgTCAwIDEwIHoiIGNsYXNzPSJhcnJvd01hcmtlclBhdGgiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDE7IHN0cm9rZS1kYXNoYXJyYXk6IDEsIDA7Ii8+PC9tYXJrZXI+PG1hcmtlciBpZD0ibWVybWFpZC1zdmdfZmxvd2NoYXJ0LXYyLXBvaW50U3RhcnQiIGNsYXNzPSJtYXJrZXIgZmxvd2NoYXJ0LXYyIiB2aWV3Qm94PSIwIDAgMTAgMTAiIHJlZlg9IjQuNSIgcmVmWT0iNSIgbWFya2VyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBtYXJrZXJXaWR0aD0iOCIgbWFya2VySGVpZ2h0PSI4IiBvcmllbnQ9ImF1dG8iPjxwYXRoIGQ9Ik0gMCA1IEwgMTAgMTAgTCAxMCAwIHoiIGNsYXNzPSJhcnJvd01hcmtlclBhdGgiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDE7IHN0cm9rZS1kYXNoYXJyYXk6IDEsIDA7Ii8+PC9tYXJrZXI+PG1hcmtlciBpZD0ibWVybWFpZC1zdmdfZmxvd2NoYXJ0LXYyLWNpcmNsZUVuZCIgY2xhc3M9Im1hcmtlciBmbG93Y2hhcnQtdjIiIHZpZXdCb3g9IjAgMCAxMCAxMCIgcmVmWD0iMTEiIHJlZlk9IjUiIG1hcmtlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgbWFya2VyV2lkdGg9IjExIiBtYXJrZXJIZWlnaHQ9IjExIiBvcmllbnQ9ImF1dG8iPjxjaXJjbGUgY3g9IjUiIGN5PSI1IiByPSI1IiBjbGFzcz0iYXJyb3dNYXJrZXJQYXRoIiBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAxOyBzdHJva2UtZGFzaGFycmF5OiAxLCAwOyIvPjwvbWFya2VyPjxtYXJrZXIgaWQ9Im1lcm1haWQtc3ZnX2Zsb3djaGFydC12Mi1jaXJjbGVTdGFydCIgY2xhc3M9Im1hcmtlciBmbG93Y2hhcnQtdjIiIHZpZXdCb3g9IjAgMCAxMCAxMCIgcmVmWD0iLTEiIHJlZlk9IjUiIG1hcmtlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgbWFya2VyV2lkdGg9IjExIiBtYXJrZXJIZWlnaHQ9IjExIiBvcmllbnQ9ImF1dG8iPjxjaXJjbGUgY3g9IjUiIGN5PSI1IiByPSI1IiBjbGFzcz0iYXJyb3dNYXJrZXJQYXRoIiBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAxOyBzdHJva2UtZGFzaGFycmF5OiAxLCAwOyIvPjwvbWFya2VyPjxtYXJrZXIgaWQ9Im1lcm1haWQtc3ZnX2Zsb3djaGFydC12Mi1jcm9zc0VuZCIgY2xhc3M9Im1hcmtlciBjcm9zcyBmbG93Y2hhcnQtdjIiIHZpZXdCb3g9IjAgMCAxMSAxMSIgcmVmWD0iMTIiIHJlZlk9IjUuMiIgbWFya2VyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBtYXJrZXJXaWR0aD0iMTEiIG1hcmtlckhlaWdodD0iMTEiIG9yaWVudD0iYXV0byI+PHBhdGggZD0iTSAxLDEgbCA5LDkgTSAxMCwxIGwgLTksOSIgY2xhc3M9ImFycm93TWFya2VyUGF0aCIgc3R5bGU9InN0cm9rZS13aWR0aDogMjsgc3Ryb2tlLWRhc2hhcnJheTogMSwgMDsiLz48L21hcmtlcj48bWFya2VyIGlkPSJtZXJtYWlkLXN2Z19mbG93Y2hhcnQtdjItY3Jvc3NTdGFydCIgY2xhc3M9Im1hcmtlciBjcm9zcyBmbG93Y2hhcnQtdjIiIHZpZXdCb3g9IjAgMCAxMSAxMSIgcmVmWD0iLTEiIHJlZlk9IjUuMiIgbWFya2VyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBtYXJrZXJXaWR0aD0iMTEiIG1hcmtlckhlaWdodD0iMTEiIG9yaWVudD0iYXV0byI+PHBhdGggZD0iTSAxLDEgbCA5LDkgTSAxMCwxIGwgLTksOSIgY2xhc3M9ImFycm93TWFya2VyUGF0aCIgc3R5bGU9InN0cm9rZS13aWR0aDogMjsgc3Ryb2tlLWRhc2hhcnJheTogMSwgMDsiLz48L21hcmtlcj48ZyBjbGFzcz0icm9vdCI+PGcgY2xhc3M9ImNsdXN0ZXJzIi8+PGcgY2xhc3M9ImVkZ2VQYXRocyI+PHBhdGggZD0iTTEzOCwxMTBMMTM4LDExNC4xNjdDMTM4LDExOC4zMzMsMTM4LDEyNi42NjcsMTM4LDEzNC4zMzNDMTM4LDE0MiwxMzgsMTQ5LDEzOCwxNTIuNUwxMzgsMTU2IiBpZD0iTF9QT19SVl8wIiBjbGFzcz0iIGVkZ2UtdGhpY2tuZXNzLW5vcm1hbCBlZGdlLXBhdHRlcm4tc29saWQgZWRnZS10aGlja25lc3Mtbm9ybWFsIGVkZ2UtcGF0dGVybi1zb2xpZCBmbG93Y2hhcnQtbGluayIgc3R5bGU9IjsiIGRhdGEtZWRnZT0idHJ1ZSIgZGF0YS1ldD0iZWRnZSIgZGF0YS1pZD0iTF9QT19SVl8wIiBkYXRhLXBvaW50cz0iVzNzaWVDSTZNVE00TENKNUlqb3hNVEI5TEhzaWVDSTZNVE00TENKNUlqb3hNelY5TEhzaWVDSTZNVE00TENKNUlqb3hOakI5WFE9PSIgbWFya2VyLWVuZD0idXJsKCNtZXJtYWlkLXN2Z19mbG93Y2hhcnQtdjItcG9pbnRFbmQpIi8+PHBhdGggZD0iTTEzOCwyNjJMMTM4LDI2Ni4xNjdDMTM4LDI3MC4zMzMsMTM4LDI3OC42NjcsMTM4LDI4Ni4zMzNDMTM4LDI5NCwxMzgsMzAxLDEzOCwzMDQuNUwxMzgsMzA4IiBpZD0iTF9SVl9JNTBfMCIgY2xhc3M9IiBlZGdlLXRoaWNrbmVzcy1ub3JtYWwgZWRnZS1wYXR0ZXJuLXNvbGlkIGVkZ2UtdGhpY2tuZXNzLW5vcm1hbCBlZGdlLXBhdHRlcm4tc29saWQgZmxvd2NoYXJ0LWxpbmsiIHN0eWxlPSI7IiBkYXRhLWVkZ2U9InRydWUiIGRhdGEtZXQ9ImVkZ2UiIGRhdGEtaWQ9IkxfUlZfSTUwXzAiIGRhdGEtcG9pbnRzPSJXM3NpZUNJNk1UTTRMQ0o1SWpveU5qSjlMSHNpZUNJNk1UTTRMQ0o1SWpveU9EZDlMSHNpZUNJNk1UTTRMQ0o1SWpvek1USjlYUT09IiBtYXJrZXItZW5kPSJ1cmwoI21lcm1haWQtc3ZnX2Zsb3djaGFydC12Mi1wb2ludEVuZCkiLz48cGF0aCBkPSJNMTM4LDQ4NkwxMzgsNDkwLjE2N0MxMzgsNDk0LjMzMywxMzgsNTAyLjY2NywxMzgsNTEwLjMzM0MxMzgsNTE4LDEzOCw1MjUsMTM4LDUyOC41TDEzOCw1MzIiIGlkPSJMX0k1MF9JMTAwXzAiIGNsYXNzPSIgZWRnZS10aGlja25lc3Mtbm9ybWFsIGVkZ2UtcGF0dGVybi1zb2xpZCBlZGdlLXRoaWNrbmVzcy1ub3JtYWwgZWRnZS1wYXR0ZXJuLXNvbGlkIGZsb3djaGFydC1saW5rIiBzdHlsZT0iOyIgZGF0YS1lZGdlPSJ0cnVlIiBkYXRhLWV0PSJlZGdlIiBkYXRhLWlkPSJMX0k1MF9JMTAwXzAiIGRhdGEtcG9pbnRzPSJXM3NpZUNJNk1UTTRMQ0o1SWpvME9EWjlMSHNpZUNJNk1UTTRMQ0o1SWpvMU1URjlMSHNpZUNJNk1UTTRMQ0o1SWpvMU16WjlYUT09IiBtYXJrZXItZW5kPSJ1cmwoI21lcm1haWQtc3ZnX2Zsb3djaGFydC12Mi1wb2ludEVuZCkiLz48cGF0aCBkPSJNMTM4LDYzOEwxMzgsNjQyLjE2N0MxMzgsNjQ2LjMzMywxMzgsNjU0LjY2NywxMzgsNjYyLjMzM0MxMzgsNjcwLDEzOCw2NzcsMTM4LDY4MC41TDEzOCw2ODQiIGlkPSJMX0kxMDBfSTIwMF8wIiBjbGFzcz0iIGVkZ2UtdGhpY2tuZXNzLW5vcm1hbCBlZGdlLXBhdHRlcm4tc29saWQgZWRnZS10aGlja25lc3Mtbm9ybWFsIGVkZ2UtcGF0dGVybi1zb2xpZCBmbG93Y2hhcnQtbGluayIgc3R5bGU9IjsiIGRhdGEtZWRnZT0idHJ1ZSIgZGF0YS1ldD0iZWRnZSIgZGF0YS1pZD0iTF9JMTAwX0kyMDBfMCIgZGF0YS1wb2ludHM9Ilczc2llQ0k2TVRNNExDSjVJam8yTXpoOUxIc2llQ0k2TVRNNExDSjVJam8yTmpOOUxIc2llQ0k2TVRNNExDSjVJam8yT0RoOVhRPT0iIG1hcmtlci1lbmQ9InVybCgjbWVybWFpZC1zdmdfZmxvd2NoYXJ0LXYyLXBvaW50RW5kKSIvPjxwYXRoIGQ9Ik0xMzgsODE0TDEzOCw4MTguMTY3QzEzOCw4MjIuMzMzLDEzOCw4MzAuNjY3LDEzOCw4MzguMzMzQzEzOCw4NDYsMTM4LDg1MywxMzgsODU2LjVMMTM4LDg2MCIgaWQ9IkxfSTIwMF9JMzAwXzAiIGNsYXNzPSIgZWRnZS10aGlja25lc3Mtbm9ybWFsIGVkZ2UtcGF0dGVybi1zb2xpZCBlZGdlLXRoaWNrbmVzcy1ub3JtYWwgZWRnZS1wYXR0ZXJuLXNvbGlkIGZsb3djaGFydC1saW5rIiBzdHlsZT0iOyIgZGF0YS1lZGdlPSJ0cnVlIiBkYXRhLWV0PSJlZGdlIiBkYXRhLWlkPSJMX0kyMDBfSTMwMF8wIiBkYXRhLXBvaW50cz0iVzNzaWVDSTZNVE00TENKNUlqbzRNVFI5TEhzaWVDSTZNVE00TENKNUlqbzRNemw5TEhzaWVDSTZNVE00TENKNUlqbzROalI5WFE9PSIgbWFya2VyLWVuZD0idXJsKCNtZXJtYWlkLXN2Z19mbG93Y2hhcnQtdjItcG9pbnRFbmQpIi8+PHBhdGggZD0iTTEzOCw5NjZMMTM4LDk3MC4xNjdDMTM4LDk3NC4zMzMsMTM4LDk4Mi42NjcsMTM4LDk5MC4zMzNDMTM4LDk5OCwxMzgsMTAwNSwxMzgsMTAwOC41TDEzOCwxMDEyIiBpZD0iTF9JMzAwX0NNXzAiIGNsYXNzPSIgZWRnZS10aGlja25lc3Mtbm9ybWFsIGVkZ2UtcGF0dGVybi1zb2xpZCBlZGdlLXRoaWNrbmVzcy1ub3JtYWwgZWRnZS1wYXR0ZXJuLXNvbGlkIGZsb3djaGFydC1saW5rIiBzdHlsZT0iOyIgZGF0YS1lZGdlPSJ0cnVlIiBkYXRhLWV0PSJlZGdlIiBkYXRhLWlkPSJMX0kzMDBfQ01fMCIgZGF0YS1wb2ludHM9Ilczc2llQ0k2TVRNNExDSjVJam81TmpaOUxIc2llQ0k2TVRNNExDSjVJam81T1RGOUxIc2llQ0k2TVRNNExDSjVJam94TURFMmZWMD0iIG1hcmtlci1lbmQ9InVybCgjbWVybWFpZC1zdmdfZmxvd2NoYXJ0LXYyLXBvaW50RW5kKSIvPjxwYXRoIGQ9Ik0xMzgsMTA5NEwxMzgsMTA5OC4xNjdDMTM4LDExMDIuMzMzLDEzOCwxMTEwLjY2NywxMzgsMTExOC4zMzNDMTM4LDExMjYsMTM4LDExMzMsMTM4LDExMzYuNUwxMzgsMTE0MCIgaWQ9IkxfQ01fTUFJTl8wIiBjbGFzcz0iIGVkZ2UtdGhpY2tuZXNzLW5vcm1hbCBlZGdlLXBhdHRlcm4tc29saWQgZWRnZS10aGlja25lc3Mtbm9ybWFsIGVkZ2UtcGF0dGVybi1zb2xpZCBmbG93Y2hhcnQtbGluayIgc3R5bGU9IjsiIGRhdGEtZWRnZT0idHJ1ZSIgZGF0YS1ldD0iZWRnZSIgZGF0YS1pZD0iTF9DTV9NQUlOXzAiIGRhdGEtcG9pbnRzPSJXM3NpZUNJNk1UTTRMQ0o1SWpveE1EazBmU3g3SW5naU9qRXpPQ3dpZVNJNk1URXhPWDBzZXlKNElqb3hNemdzSW5raU9qRXhORFI5WFE9PSIgbWFya2VyLWVuZD0idXJsKCNtZXJtYWlkLXN2Z19mbG93Y2hhcnQtdjItcG9pbnRFbmQpIi8+PHBhdGggZD0iTTEzOCwxMTk4TDEzOCwxMjA0LjE2N0MxMzgsMTIxMC4zMzMsMTM4LDEyMjIuNjY3LDEzOCwxMjM0LjMzM0MxMzgsMTI0NiwxMzgsMTI1NywxMzgsMTI2Mi41TDEzOCwxMjY4IiBpZD0iTF9NQUlOX0VYSVRfMCIgY2xhc3M9IiBlZGdlLXRoaWNrbmVzcy1ub3JtYWwgZWRnZS1wYXR0ZXJuLXNvbGlkIGVkZ2UtdGhpY2tuZXNzLW5vcm1hbCBlZGdlLXBhdHRlcm4tc29saWQgZmxvd2NoYXJ0LWxpbmsiIHN0eWxlPSI7IiBkYXRhLWVkZ2U9InRydWUiIGRhdGEtZXQ9ImVkZ2UiIGRhdGEtaWQ9IkxfTUFJTl9FWElUXzAiIGRhdGEtcG9pbnRzPSJXM3NpZUNJNk1UTTRMQ0o1SWpveE1UazRmU3g3SW5naU9qRXpPQ3dpZVNJNk1USXpOWDBzZXlKNElqb3hNemdzSW5raU9qRXlOeko5WFE9PSIgbWFya2VyLWVuZD0idXJsKCNtZXJtYWlkLXN2Z19mbG93Y2hhcnQtdjItcG9pbnRFbmQpIi8+PC9nPjxnIGNsYXNzPSJlZGdlTGFiZWxzIj48ZyBjbGFzcz0iZWRnZUxhYmVsIj48ZyBjbGFzcz0ibGFiZWwiIGRhdGEtaWQ9IkxfUE9fUlZfMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwgMCkiPjxmb3JlaWduT2JqZWN0IHdpZHRoPSIwIiBoZWlnaHQ9IjAiPjxkaXYgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiIGNsYXNzPSJsYWJlbEJrZyIgc3R5bGU9ImRpc3BsYXk6IHRhYmxlLWNlbGw7IHdoaXRlLXNwYWNlOiBub3dyYXA7IGxpbmUtaGVpZ2h0OiAxLjU7IG1heC13aWR0aDogMjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsiPjxzcGFuIGNsYXNzPSJlZGdlTGFiZWwgIj48L3NwYW4+PC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PGcgY2xhc3M9ImVkZ2VMYWJlbCI+PGcgY2xhc3M9ImxhYmVsIiBkYXRhLWlkPSJMX1JWX0k1MF8wIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLCAwKSI+PGZvcmVpZ25PYmplY3Qgd2lkdGg9IjAiIGhlaWdodD0iMCI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgY2xhc3M9ImxhYmVsQmtnIiBzdHlsZT0iZGlzcGxheTogdGFibGUtY2VsbDsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgbGluZS1oZWlnaHQ6IDEuNTsgbWF4LXdpZHRoOiAyMDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyI+PHNwYW4gY2xhc3M9ImVkZ2VMYWJlbCAiPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48ZyBjbGFzcz0iZWRnZUxhYmVsIj48ZyBjbGFzcz0ibGFiZWwiIGRhdGEtaWQ9IkxfSTUwX0kxMDBfMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwgMCkiPjxmb3JlaWduT2JqZWN0IHdpZHRoPSIwIiBoZWlnaHQ9IjAiPjxkaXYgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiIGNsYXNzPSJsYWJlbEJrZyIgc3R5bGU9ImRpc3BsYXk6IHRhYmxlLWNlbGw7IHdoaXRlLXNwYWNlOiBub3dyYXA7IGxpbmUtaGVpZ2h0OiAxLjU7IG1heC13aWR0aDogMjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsiPjxzcGFuIGNsYXNzPSJlZGdlTGFiZWwgIj48L3NwYW4+PC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PGcgY2xhc3M9ImVkZ2VMYWJlbCI+PGcgY2xhc3M9ImxhYmVsIiBkYXRhLWlkPSJMX0kxMDBfSTIwMF8wIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLCAwKSI+PGZvcmVpZ25PYmplY3Qgd2lkdGg9IjAiIGhlaWdodD0iMCI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgY2xhc3M9ImxhYmVsQmtnIiBzdHlsZT0iZGlzcGxheTogdGFibGUtY2VsbDsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgbGluZS1oZWlnaHQ6IDEuNTsgbWF4LXdpZHRoOiAyMDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyI+PHNwYW4gY2xhc3M9ImVkZ2VMYWJlbCAiPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48ZyBjbGFzcz0iZWRnZUxhYmVsIj48ZyBjbGFzcz0ibGFiZWwiIGRhdGEtaWQ9IkxfSTIwMF9JMzAwXzAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsIDApIj48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBjbGFzcz0ibGFiZWxCa2ciIHN0eWxlPSJkaXNwbGF5OiB0YWJsZS1jZWxsOyB3aGl0ZS1zcGFjZTogbm93cmFwOyBsaW5lLWhlaWdodDogMS41OyBtYXgtd2lkdGg6IDIwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48c3BhbiBjbGFzcz0iZWRnZUxhYmVsICI+PC9zcGFuPjwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjxnIGNsYXNzPSJlZGdlTGFiZWwiPjxnIGNsYXNzPSJsYWJlbCIgZGF0YS1pZD0iTF9JMzAwX0NNXzAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsIDApIj48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBjbGFzcz0ibGFiZWxCa2ciIHN0eWxlPSJkaXNwbGF5OiB0YWJsZS1jZWxsOyB3aGl0ZS1zcGFjZTogbm93cmFwOyBsaW5lLWhlaWdodDogMS41OyBtYXgtd2lkdGg6IDIwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48c3BhbiBjbGFzcz0iZWRnZUxhYmVsICI+PC9zcGFuPjwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjxnIGNsYXNzPSJlZGdlTGFiZWwiPjxnIGNsYXNzPSJsYWJlbCIgZGF0YS1pZD0iTF9DTV9NQUlOXzAiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsIDApIj48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBjbGFzcz0ibGFiZWxCa2ciIHN0eWxlPSJkaXNwbGF5OiB0YWJsZS1jZWxsOyB3aGl0ZS1zcGFjZTogbm93cmFwOyBsaW5lLWhlaWdodDogMS41OyBtYXgtd2lkdGg6IDIwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48c3BhbiBjbGFzcz0iZWRnZUxhYmVsICI+PC9zcGFuPjwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjxnIGNsYXNzPSJlZGdlTGFiZWwiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEzOCwgMTIzNSkiPjxnIGNsYXNzPSJsYWJlbCIgZGF0YS1pZD0iTF9NQUlOX0VYSVRfMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTI0Ljg5ODQzNzUsIC0xMikiPjxmb3JlaWduT2JqZWN0IHdpZHRoPSI0OS43OTY4NzUiIGhlaWdodD0iMjQiPjxkaXYgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiIGNsYXNzPSJsYWJlbEJrZyIgc3R5bGU9ImRpc3BsYXk6IHRhYmxlLWNlbGw7IHdoaXRlLXNwYWNlOiBub3dyYXA7IGxpbmUtaGVpZ2h0OiAxLjU7IG1heC13aWR0aDogMjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsiPjxzcGFuIGNsYXNzPSJlZGdlTGFiZWwgIj48cD5yZXR1cm5zPC9wPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48L2c+PGcgY2xhc3M9Im5vZGVzIj48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0ICAiIGlkPSJmbG93Y2hhcnQtUE8tMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTM4LCA1OSkiPjxyZWN0IGNsYXNzPSJiYXNpYyBsYWJlbC1jb250YWluZXIiIHN0eWxlPSIiIHg9Ii0xMzAiIHk9Ii01MSIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIxMDIiLz48ZyBjbGFzcz0ibGFiZWwiIHN0eWxlPSIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMDAsIC0zNikiPjxyZWN0Lz48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjcyIj48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzdHlsZT0iZGlzcGxheTogdGFibGU7IHdoaXRlLXNwYWNlOiBicmVhay1zcGFjZXM7IGxpbmUtaGVpZ2h0OiAxLjU7IG1heC13aWR0aDogMjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgd2lkdGg6IDIwMHB4OyI+PHNwYW4gY2xhc3M9Im5vZGVMYWJlbCAiPjxwPlBvd2VyLW9uIC8gcmVzZXQ8YnIgLz42NTgxNiBpbiA2NTAyLWVtdWxhdGlvbiBtb2RlIChFPTEpPC9wPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0ICAiIGlkPSJmbG93Y2hhcnQtUlYtMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTM4LCAyMTEpIj48cmVjdCBjbGFzcz0iYmFzaWMgbGFiZWwtY29udGFpbmVyIiBzdHlsZT0iIiB4PSItMTMwIiB5PSItNTEiIHdpZHRoPSIyNjAiIGhlaWdodD0iMTAyIi8+PGcgY2xhc3M9ImxhYmVsIiBzdHlsZT0iIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTAwLCAtMzYpIj48cmVjdC8+PGZvcmVpZ25PYmplY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSI3MiI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImRpc3BsYXk6IHRhYmxlOyB3aGl0ZS1zcGFjZTogYnJlYWstc3BhY2VzOyBsaW5lLWhlaWdodDogMS41OyBtYXgtd2lkdGg6IDIwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IHdpZHRoOiAyMDBweDsiPjxzcGFuIGNsYXNzPSJub2RlTGFiZWwgIj48cD5DUFUgcmVhZHMgZW11bGF0aW9uIFJFU0VUIHZlY3RvciBAICRGRkZDPGJyIC8+4oaSIF9zdGFydDwvcD48L3NwYW4+PC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PGcgY2xhc3M9Im5vZGUgZGVmYXVsdCAgIiBpZD0iZmxvd2NoYXJ0LUk1MC0zIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMzgsIDM5OSkiPjxyZWN0IGNsYXNzPSJiYXNpYyBsYWJlbC1jb250YWluZXIiIHN0eWxlPSIiIHg9Ii0xMzAiIHk9Ii04NyIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIxNzQiLz48ZyBjbGFzcz0ibGFiZWwiIHN0eWxlPSIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMDAsIC03MikiPjxyZWN0Lz48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0NCI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImRpc3BsYXk6IHRhYmxlOyB3aGl0ZS1zcGFjZTogYnJlYWstc3BhY2VzOyBsaW5lLWhlaWdodDogMS41OyBtYXgtd2lkdGg6IDIwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IHdpZHRoOiAyMDBweDsiPjxzcGFuIGNsYXNzPSJub2RlTGFiZWwgIj48cD4uaW5pdC41MCAoY3J0MC5jKSDigJQgJDgwMDA8YnIgLz5uYXRpdmUtbW9kZSBwcmVhbWJsZTo8YnIgLz5TRUkvQ0xEIOKGkiBYQ0Ug4oaSIDE2LWJpdCBUWFMg4oaSIFNFUCAjJDMwIOKGkiBQSEsvUExCIChEQlI9MCkg4oaSIFBQVSBmb3JjZS1ibGFuazwvcD48L3NwYW4+PC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PGcgY2xhc3M9Im5vZGUgZGVmYXVsdCAgIiBpZD0iZmxvd2NoYXJ0LUkxMDAtNSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTM4LCA1ODcpIj48cmVjdCBjbGFzcz0iYmFzaWMgbGFiZWwtY29udGFpbmVyIiBzdHlsZT0iIiB4PSItMTMwIiB5PSItNTEiIHdpZHRoPSIyNjAiIGhlaWdodD0iMTAyIi8+PGcgY2xhc3M9ImxhYmVsIiBzdHlsZT0iIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTAwLCAtMzYpIj48cmVjdC8+PGZvcmVpZ25PYmplY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSI3MiI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImRpc3BsYXk6IHRhYmxlOyB3aGl0ZS1zcGFjZTogYnJlYWstc3BhY2VzOyBsaW5lLWhlaWdodDogMS41OyBtYXgtd2lkdGg6IDIwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IHdpZHRoOiAyMDBweDsiPjxzcGFuIGNsYXNzPSJub2RlTGFiZWwgIj48cD4uaW5pdC4xMDAgKGluaXQtc3RhY2suUyk8YnIgLz5fX2RvX2luaXRfc3RhY2sg4oCUIHBvaW50IHRoZSBzb2Z0IHN0YWNrIGF0ICQyMDAwPC9wPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0ICAiIGlkPSJmbG93Y2hhcnQtSTIwMC03IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMzgsIDc1MSkiPjxyZWN0IGNsYXNzPSJiYXNpYyBsYWJlbC1jb250YWluZXIiIHN0eWxlPSIiIHg9Ii0xMzAiIHk9Ii02MyIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIxMjYiLz48ZyBjbGFzcz0ibGFiZWwiIHN0eWxlPSIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMDAsIC00OCkiPjxyZWN0Lz48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9Ijk2Ij48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzdHlsZT0iZGlzcGxheTogdGFibGU7IHdoaXRlLXNwYWNlOiBicmVhay1zcGFjZXM7IGxpbmUtaGVpZ2h0OiAxLjU7IG1heC13aWR0aDogMjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgd2lkdGg6IDIwMHB4OyI+PHNwYW4gY2xhc3M9Im5vZGVMYWJlbCAiPjxwPi5pbml0LjIwMCAoY29weS1kYXRhIC8gemVyby1ic3MpPGJyIC8+Y29weSAuZGF0YSBST03ihpJSQU0sIGNsZWFyIC5ic3MgKCsgenAgdmFyaWFudHMpPC9wPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0ICAiIGlkPSJmbG93Y2hhcnQtSTMwMC05IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMzgsIDkxNSkiPjxyZWN0IGNsYXNzPSJiYXNpYyBsYWJlbC1jb250YWluZXIiIHN0eWxlPSIiIHg9Ii0xMzAiIHk9Ii01MSIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIxMDIiLz48ZyBjbGFzcz0ibGFiZWwiIHN0eWxlPSIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMDAsIC0zNikiPjxyZWN0Lz48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjcyIj48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzdHlsZT0iZGlzcGxheTogdGFibGU7IHdoaXRlLXNwYWNlOiBicmVhay1zcGFjZXM7IGxpbmUtaGVpZ2h0OiAxLjU7IG1heC13aWR0aDogMjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgd2lkdGg6IDIwMHB4OyI+PHNwYW4gY2xhc3M9Im5vZGVMYWJlbCAiPjxwPi5pbml0LjMwMCAoaW5pdC1hcnJheS5jKTxiciAvPnJ1biBfX2luaXRfYXJyYXkgY29uc3RydWN0b3JzIChpZiBhbnkpPC9wPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0ICAiIGlkPSJmbG93Y2hhcnQtQ00tMTEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEzOCwgMTA1NSkiPjxyZWN0IGNsYXNzPSJiYXNpYyBsYWJlbC1jb250YWluZXIiIHN0eWxlPSIiIHg9Ii05My41NzgxMjUiIHk9Ii0zOSIgd2lkdGg9IjE4Ny4xNTYyNSIgaGVpZ2h0PSI3OCIvPjxnIGNsYXNzPSJsYWJlbCIgc3R5bGU9IiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTYzLjU3ODEyNSwgLTI0KSI+PHJlY3QvPjxmb3JlaWduT2JqZWN0IHdpZHRoPSIxMjcuMTU2MjUiIGhlaWdodD0iNDgiPjxkaXYgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiIHN0eWxlPSJkaXNwbGF5OiB0YWJsZS1jZWxsOyB3aGl0ZS1zcGFjZTogbm93cmFwOyBsaW5lLWhlaWdodDogMS41OyBtYXgtd2lkdGg6IDIwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48c3BhbiBjbGFzcz0ibm9kZUxhYmVsICI+PHA+LmNhbGxfbWFpbiAoY3J0MC5vKTxiciAvPmNhbGwgbWFpbigpPC9wPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0ICAiIGlkPSJmbG93Y2hhcnQtTUFJTi0xMyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTM4LCAxMTcxKSI+PHJlY3QgY2xhc3M9ImJhc2ljIGxhYmVsLWNvbnRhaW5lciIgc3R5bGU9IiIgeD0iLTUyLjY3MTg3NSIgeT0iLTI3IiB3aWR0aD0iMTA1LjM0Mzc1IiBoZWlnaHQ9IjU0Ii8+PGcgY2xhc3M9ImxhYmVsIiBzdHlsZT0iIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjIuNjcxODc1LCAtMTIpIj48cmVjdC8+PGZvcmVpZ25PYmplY3Qgd2lkdGg9IjQ1LjM0Mzc1IiBoZWlnaHQ9IjI0Ij48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzdHlsZT0iZGlzcGxheTogdGFibGUtY2VsbDsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgbGluZS1oZWlnaHQ6IDEuNTsgbWF4LXdpZHRoOiAyMDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyI+PHNwYW4gY2xhc3M9Im5vZGVMYWJlbCAiPjxwPm1haW4oKTwvcD48L3NwYW4+PC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PGcgY2xhc3M9Im5vZGUgZGVmYXVsdCAgIiBpZD0iZmxvd2NoYXJ0LUVYSVQtMTUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEzOCwgMTMyMykiPjxyZWN0IGNsYXNzPSJiYXNpYyBsYWJlbC1jb250YWluZXIiIHN0eWxlPSIiIHg9Ii0xMzAiIHk9Ii01MSIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIxMDIiLz48ZyBjbGFzcz0ibGFiZWwiIHN0eWxlPSIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMDAsIC0zNikiPjxyZWN0Lz48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjcyIj48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzdHlsZT0iZGlzcGxheTogdGFibGU7IHdoaXRlLXNwYWNlOiBicmVhay1zcGFjZXM7IGxpbmUtaGVpZ2h0OiAxLjU7IG1heC13aWR0aDogMjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgd2lkdGg6IDIwMHB4OyI+PHNwYW4gY2xhc3M9Im5vZGVMYWJlbCAiPjxwPmNvbW1vbi1leGl0LWxvb3A8YnIgLz5pbmZpbml0ZSBsb29wIChubyBPUyB0byByZXR1cm4gdG8pPC9wPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48L2c+PC9nPjwvZz48L3N2Zz4="></div>

`.init.*` fragments are emitted into `.text` and ordered by their numeric suffix, so the **section number is
the boot order**. Unused fragments are garbage-collected (e.g. `hello.c` pulls in only `.init.50`, `.100`,
`.200`-zero-zp-bss, `.call_main` — no `.data` to copy, no constructors).

## Stage 0 — power-on and the reset vector

The 5A22 (the SNES's 65816) comes out of reset in **emulation mode (E=1)**, so it fetches the **emulation**
RESET vector at **`$FFFC`**. The linker points it at `_start`, which is the very first byte of `.text`:

```
$8000   _start = .                          ← .text base = reset entry
$8000   crt0.o:(.init.50)        0x18       ← native-mode preamble (this is _start)
$FFFC   SHORT(_start)                       ← emulation RESET vector
```

(LoROM maps ROM `$8000-$FFFF` to file offset `$0000-$7FFF`, so `$FFFC` is file offset `$7FFC`.)

## Stage 1 — `.init.50`: native-mode preamble (`crt0.c`)

The 24-byte fragment that establishes the machine contract. Source:

```c
asm(".section .init.50,\"axR\",@progbits\n"
    "  sei\n"                    // mask IRQ
    "  cld\n"                    // binary mode (decimal flag undefined at reset)
    "  clc\n"                    // clear carry, then exchange it with E:
    "  xce\n"                    // XCE      -> E=0, 65816 native mode (M=1,X=1 kept)
    "  rep #$10\n"               // REP #$10 -> 16-bit index regs (so txs takes 16 bits)
    "  ldx #$01ff\n"             // LDX #$01ff (16-bit immediate; an 8-bit txs => SP=$00FF)
    "  txs\n"                    // hardware stack pointer -> $01FF (page 1)
    "  sep #$30\n"               // SEP #$30 -> M=1,X=1: 8-bit A+index (codegen default)
    "  phk\n"                    // PHK -> push program bank (=0; reset code is bank $00)
    "  plb\n"                    // PLB -> DBR := 0 (explicit; abs globals + MMIO read DBR:addr)
    "  lda #$00\n"               // A = $00 for the NMITIMEN store below
    "  sta $4200\n"              // NMITIMEN: no NMI/IRQ/auto-joypad
    "  lda #$8f\n"               // A = $8F (bit 7 = force-blank, brightness 0)
    "  sta $2100\n");            // INIDISP: force blank, brightness 0
```

> crt0 is built with `-mcpu=mosw65816 -fno-lto` (set in `platforms/snes/CMakeLists.txt`), so the 65816-only
> ops are plain mnemonics. `-fno-lto` is required because module-level inline `asm()` under LTO does not
> receive the `W65816` subtarget feature; with it, `ldx #$01ff` assembles to the correct 16-bit immediate
> (`a2 ff 01`), byte-identical to the old hand-encoded `.byte` form.

### What actually executes (the linked bytes)

```
78  d8  18  fb  c2 10  a2 ff 01  9a  e2 30  4b  ab  a9 00  8d 00 42  a9 8f  8d 00 21
SEI CLD CLC XCE REP#10 LDX#$01ff TXS SEP#30 PHK PLB LDA#0 STA $4200 LDA#8F STA $2100
                └ X→16 └ 16-bit  │   └ M=1  │   │            └ NMITIMEN     └ INIDISP
                       SP value  │   X=1    │   └ DBR := 0     off          force-blank
                                 SP=$01FF   PB pushed (=0)
```

`dev/run.sh crt0native` asserts this byte sequence (and the runtime DBR=0) as a standing gate.

### The native-mode contract this leaves

| Register | Value after `.init.50` | How / why |
|---|---|---|
| **E** | 0 (native) | `XCE` — required for 16-bit accumulator/index codegen (`+mos-a16`/`+mos-xy16`) |
| **SP** | `$01FF` | page-1 hardware stack via a transient 16-bit `ldx #$01ff; txs` (an 8-bit `txs` would set `$00FF` and collide with the direct page) |
| **M** | 1 (8-bit A) | `SEP #$30` — the codegen default; 16-bit regions are bracketed by `rep/sep #$20` |
| **X** | 1 (8-bit index) | `SEP #$30`; 16-bit-index regions bracketed by `rep/sep #$10` (`+mos-xy16`) |
| **DBR** | 0 | `PHK; PLB` — explicit, so the 8-bit `abs`/`R_MOS_ADDR16` global path **and** the MMIO writes (which read `DBR:addr`) land in bank 0. Reset already leaves DBR=0; making it explicit means a later bank switch / `MVN`/`MVP` / interrupt can't silently break the invariant. The native-16 `long`/`R_MOS_ADDR24` path is DBR-independent. |
| **DP** | 0 | reset default; the direct page never moves on this platform (imaginary registers + zero page live at `$0000`) |
| **PPU** | force-blank, NMI/IRQ off | `INIDISP=$8F`, `NMITIMEN=$00` — a known display state with interrupts masked through bring-up |

## Stage 2 — the common init chain

Pulled in by `CMakeLists.txt`
(`merge_libraries(snes-crt0 common-copy-data common-init-stack common-zero-bss common-exit-loop)`), each piece
contributing a numbered `.init` fragment that runs after `.init.50`:

| Order | Fragment | Source | Does |
|---|---|---|---|
| `.init.100` | `__do_init_stack` | `common/crt0/init-stack.S` | point the **soft stack** at `__stack = $2000` (it grows **down** through low WRAM) |
| `.init.200` | copy `.data`, clear `.bss` | `copy-data.c`, `copy-zp-data.c`, `zero-bss.c`, `zero-zp-bss.c` | copy initialized `.data` from its ROM image (LMA) into RAM (VMA); zero `.bss` and the zero-page `.bss` |
| `.init.300` | `__init_array` | `init-array.c` | run C++ static constructors / `__attribute__((constructor))` (omitted if none) |
| — | `.call_main` | `crt0.o` | `jsr main` |

> The **soft stack** (the C call/local stack) is deliberately separate from the 65816 **hardware stack**
> ($0100-$01FF). Locals/spills use the soft stack via the `__rc0/__rc1` pointer; `JSR`/`RTS` return addresses
> use the hardware stack. This is why a page-1 hardware stack (`SP=$01FF`) is sufficient even in native mode.

## Stage 3 — `main()` and exit

`.call_main` calls `main()`. On a console there is no OS to return to, so `common-exit-loop` makes a return
from `main()` fall into an **infinite loop** (the program "ends" by spinning). Bring-up test ROMs typically
compute a `corpus_result` / `sentinel` global and then `for (;;) {}` so an emulator can settle and read the
value out of WRAM.

## Memory map at boot (`link.ld`)

```
$0000-$001F   imaginary (zero-page) registers __rc0..__rc31   (the GPR/Imag8/Imag16 file)
$0020-$00FF   zero page / direct page
$0100-$01FF   hardware stack (JSR/RTS, interrupts)            SP set to $01FF
$0200-$1FFF   low WRAM:  soft stack grows DOWN from $2000;    .data / .bss / heap grow UP from $0200
$2000-$7FFF   (bank $00) PPU/CPU MMIO, etc.                   $2100 INIDISP, $4200 NMITIMEN
$8000-$FFFF   cartridge ROM (LoROM): .text/.init, .rodata,    header @ $FFB0, vectors @ $FFE0-$FFFF
              .data LOAD image
```

`snes-far` adds a second ROM bank (`$018000-$01FFFF`) for cross-bank far **data**, read via DBR-independent
`long`/`[dp]` addressing; code stays in bank `$00`, so the boot sequence is identical (the crt0 is inherited
via `PARENT snes`).

## Interrupt & reset vectors (`link.ld`)

The 65816 has **two** vector tables — one used in native mode, one in emulation mode. The machine boots in
emulation mode (→ `$FFFC` RESET); after `XCE` any interrupt would use the native table, but interrupts stay
masked through bring-up (`SEI` + `NMITIMEN=0`), and both tables point NMI/IRQ at the same stubs.

```
Native ($FFE0-$FFEF):  $FFE6 BRK→irq   $FFEA NMI→nmi   $FFEE IRQ→irq   (COP/ABORT→0)
Emulation ($FFF0-$FFFF): $FFFA NMI→nmi  $FFFC RESET→_start  $FFFE IRQ→irq
```

The default handlers are **weak** bare-`rti` stubs (`crt0.c`), overridable by
defining `nmi` / `irq` in user code. A bare `rti` is width-safe (it restores `P`, hence M/X, on return).

> **For a future real handler (out of scope today):** a native-mode ISR can be entered with **M=0 and/or
> X=0** (it may interrupt a `rep #$30` region), so it must save `P` and force known widths before touching
> A/X/Y, and restore via `rti`. The current stubs sidestep this by doing nothing while interrupts are masked.

## Cartridge header (`header.s`)

Not executed, but part of the boot image: the LoROM internal header at **`$FFB0-$FFDF`** (title `"LLVM-MOS
SNES"`, map mode `$20` = LoROM/slow, ROM size `$05` = 32 KiB, NTSC). The checksum/complement at `$FFDC/$FFDE`
are placeholders patched post-link by `tools/snes-checksum.py`.

## References

- Native-mode entry rationale + the 8-bit-safe argument:
  `2026-06-14-321-native-mode-crt0.md`.
- Explicit DBR=0 contract (the `phk; plb`) + the addressing/relocation analysis:
  `2026-06-18-321-native-mode-crt0-xy16.md`.
- Standing contract gate: `dev/run.sh crt0native` (`dev/crt0native.sh`).
- Build/test mechanics & the addressing/DBR note: `agent-handoff.md`.
