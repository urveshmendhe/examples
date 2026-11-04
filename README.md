# Guestbook Application Monitoring with Prometheus and Grafana

## Overview

This project extends the Pulumi Kubernetes Guestbook application by adding monitoring and observability using:

- Prometheus
- Grafana
- Alertmanager
- Node Exporter
- Kube State Metrics

The monitoring stack is deployed using Pulumi and Helm charts.

---

# Deployment Instructions

## Prerequisites

- Kubernetes Cluster
- kubectl
- Helm 3
- Pulumi
- Node.js

Verify installation:

```bash
kubectl version --client
helm version
pulumi version
node --version
```

---

## Install Project Dependencies

```bash
npm install
```

---

## Select/Create Pulumi Stack

Create stack:

```bash
pulumi stack init dev
```

or select existing stack:

```bash
pulumi stack select dev
```

---

## Deploy Guestbook and Monitoring Stack

```bash
pulumi up
```

Verify deployment:

```bash
kubectl get pods
kubectl get pods -n monitoring
```

Expected monitoring components:

```text
grafana
prometheus-server
prometheus-alertmanager
prometheus-node-exporter
prometheus-kube-state-metrics
prometheus-pushgateway
```

All pods should be in:

```text
STATUS = Running
```

---

# Pulumi Configuration Changes Made

## 1. Monitoring Namespace Added

A dedicated Kubernetes namespace was created for monitoring resources:

```typescript
const monitoringNamespace =
    new k8s.core.v1.Namespace(
        "monitoring",
        {
            metadata: {
                name: "monitoring",
            },
        }
    );
```

---

## 2. Prometheus Helm Deployment

Created:

```text
monitoring/prometheus.ts
```

Prometheus is deployed using the Prometheus Community Helm Chart:

```typescript
new k8s.helm.v3.Release(
    "prometheus",
    {
        chart: "prometheus",
        repositoryOpts: {
            repo: "https://prometheus-community.github.io/helm-charts",
        },
        namespace: namespace.metadata.name,
    }
);
```

---

## 3. Grafana Helm Deployment

Created:

```text
monitoring/grafana.ts
```

Grafana is deployed using the official Grafana Helm Chart.

```typescript
new k8s.helm.v3.Release(
    "grafana",
    {
        chart: "grafana",
        repositoryOpts: {
            repo: "https://grafana.github.io/helm-charts",
        },

        values: {
            adminUser: "admin",
            adminPassword: "admin123",

            service: {
                type: "NodePort",
            },
        },
    }
);
```

---

## 4. Frontend Service Monitoring Enabled

Guestbook frontend service was updated with Prometheus scrape annotations.

```typescript
metadata: {
    annotations: {
        "prometheus.io/scrape": "true",
        "prometheus.io/port": "80",
        "prometheus.io/path": "/metrics",
    },
}
```

This enables Prometheus service discovery for the Guestbook frontend service.

---

## 5. Monitoring Outputs Added

Pulumi outputs were added:

```typescript
export const grafanaUsername = "admin";
export const grafanaPassword = "admin123";
export const monitoringNamespaceName =
    monitoringNamespace.metadata.name;
```

---

# Grafana Access

## Start Grafana Port Forwarding

```bash
kubectl port-forward -n monitoring svc/grafana-eb064e59 3000:80
```

Expected:

```text
Forwarding from 127.0.0.1:3000 -> 80
```

---

## Open Grafana

```text
http://localhost:3000
```

### Admin Credentials

```text
Username: admin
Password: admin123
```

---

# Prometheus Access

Start Prometheus port forwarding:

```bash
kubectl port-forward -n monitoring svc/prometheus-e15a6256-server 9090:80
```

Expected:

```text
Forwarding from 127.0.0.1:9090 -> 9090
```

Open:

```text
http://localhost:9090
```

---

# Configure Prometheus as Grafana Datasource

Login to Grafana.

Navigate to:

```text
Connections → Data Sources
```

Click:

```text
Add Data Source
```

Select:

```text
Prometheus
```

Use URL:

```text
http://prometheus-e15a6256-server.monitoring.svc.cluster.local
```

Click:

```text
Save & Test
```

Expected result:

```text
Data source is working
```

This confirms Grafana can successfully connect to Prometheus.

---

# Grafana Dashboard

Dashboard Name:

```text
Guestbook Application Monitoring
```

## Frontend Pod Count

```promql
count(kube_pod_info{pod=~"frontend.*"})
```

Visualization:

```text
Stat
```

---

## Redis Pod Count

```promql
count(kube_pod_info{pod=~"redis.*"})
```

Visualization:

```text
Stat
```

---

## CPU Usage

```promql
sum(rate(container_cpu_usage_seconds_total{pod=~"frontend.*|redis.*"}[5m]))
```

Visualization:

```text
Time Series
```

---

## Memory Usage

```promql
sum(container_memory_usage_bytes{pod=~"frontend.*|redis.*"})
```

Visualization:

```text
Time Series
```

---

## Container Restarts

```promql
sum(kube_pod_container_status_restarts_total{pod=~"frontend.*|redis.*"})
```

Visualization:

```text
Stat
```

---

# How to Verify Guestbook Metrics Are Being Scraped by Prometheus

## Step 1: Verify Frontend Service Annotations

Run:

```bash
kubectl describe svc frontend
```

Verify annotations exist:

```text
prometheus.io/scrape=true
prometheus.io/port=80
prometheus.io/path=/metrics
```

---

## Step 2: Verify Prometheus Targets

Open:

```text
http://localhost:9090
```

Navigate to:

```text
Status → Targets
```

Verify that Prometheus has discovered Kubernetes targets.

Targets should display:

```text
State = UP
```

for healthy targets.

---

## Step 3: Verify Metrics Collection

Open Prometheus Query UI:

```text
http://localhost:9090
```

Run:

### Pod Count

```promql
count(kube_pod_info)
```

### CPU Usage

```promql
sum(rate(container_cpu_usage_seconds_total[5m]))
```

### Memory Usage

```promql
sum(container_memory_usage_bytes)
```

If metrics return values, Prometheus is successfully scraping and storing monitoring data.

---

## Step 4: Verify Metrics in Grafana

Open Grafana:

```text
http://localhost:3000
```

Open the dashboard:

```text
Guestbook Application Monitoring
```

Verify panels display real-time values and graphs for:

- Pod Count
- CPU Usage
- Memory Usage
- Container Restarts

---

# Notes

The sample Guestbook application does not natively expose a Prometheus `/metrics` endpoint.

Prometheus service discovery is configured through Kubernetes service annotations, while resource monitoring is provided through:

- Prometheus
- Node Exporter
- Kube State Metrics

Application-level metrics such as request count, request rate, and error rate would require additional Prometheus instrumentation within the Guestbook application or an exporter sidecar.