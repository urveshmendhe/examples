# Guestbook Monitoring with Prometheus and Grafana

## Overview

This project extends the Pulumi Kubernetes Guestbook application with monitoring and observability capabilities using Prometheus and Grafana.

The monitoring stack includes:

- Prometheus
- Grafana
- Alertmanager
- Node Exporter
- Kube State Metrics

Guestbook services are configured with Prometheus scrape annotations and monitored through Prometheus and Grafana.

---

# Deploy the Application

## Prerequisites

- Kubernetes Cluster
- kubectl
- Helm 3
- Pulumi
- Node.js

Verify tools:

```bash
kubectl version --client
helm version
pulumi version
node --version
```

## Install Dependencies

```bash
npm install
```

## Select/Create Pulumi Stack

```bash
pulumi stack init dev
```

or

```bash
pulumi stack select dev
```

## Deploy Guestbook and Monitoring Stack

```bash
pulumi up
```

Verify the deployment:

```bash
kubectl get pods
kubectl get pods -n monitoring
```

Expected monitoring pods:

```text
grafana-xxxx
prometheus-xxxx-server
prometheus-xxxx-alertmanager
prometheus-xxxx-node-exporter
prometheus-xxxx-kube-state-metrics
```

---

# Access Prometheus

Start port forwarding:

```bash
kubectl port-forward -n monitoring svc/prometheus-e15a6256-server 9090:80
```

Open:

```text
http://localhost:9090
```

---

# Access Grafana

Start port forwarding:

```bash
kubectl port-forward -n monitoring svc/grafana-eb064e59 3000:80
```

Open:

```text
http://localhost:3000
```

## Grafana Credentials

```text
Username: admin
Password: admin123
```

---

# Configure Prometheus as Grafana Datasource

1. Login to Grafana.
2. Navigate to:

```text
Connections → Data Sources
```

3. Click:

```text
Add Data Source
```

4. Select:

```text
Prometheus
```

5. Configure URL:

```text
http://prometheus-e15a6256-server.monitoring.svc.cluster.local
```

6. Click:

```text
Save & Test
```

Expected message:

```text
Data source is working
```

---

# Grafana Dashboard

Dashboard Name:

```text
Guestbook Application Monitoring
```

Included Panels:

### Frontend Pod Count

```promql
count(kube_pod_info{pod=~"frontend.*"})
```

### Redis Pod Co*nt

*``promql
count(kube_pod_info*pod=~"redis.*"})
```

### CPU Usage

```promql
sum(rate(container_cpu_usage_seconds_total{pod=~"frontend.*|redis.*"}[5m]))
```

### Memory Usage

```promql
sum(container_memory_usage_bytes{pod=~"frontend.*|redis.*"})
```

### Container Restarts

```promql
sum(kube_pod_container_status_restarts_total{pod=~"frontend.*|redis.*"})
```

---

# How to Verify Guestbook Metrics Are Being Scraped

## 1. Verify Service Annotations

Check the frontend service:

```bash
kubectl describe svc frontend
```

Expected:

```text
prometheus.io/scrape: true
prometheus.io/port: 80
prometheus.io/path: /metrics
```

---

## 2. Verify Prometheus Targets

Open Prometheus:

```text
http://localhost:9090
```

Go to:

```text
Status → Targets
```

Verify that Kubernetes service discovery is detecting monitored targets.

Targets should show:

```text
State = UP
```

---

## 3. Verify Monitoring Components

```bash
kubectl get pods -n monitoring
```

Expected:

```text
grafana                          Running
prometheus-server                Running
prometheus-alertmanager          Running
prometheus-node-exporter         Running
prometheus-kube-state-metrics    Running
```

---

## 4. Verify Metrics in Prometheus

Open:

```text
http://localhost:9090
```

Run the following queries:

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

Successful query results confirm Prometheus is collecting metrics.

---

# Notes

The Guestbook sample application does not natively expose a Prometheus `/metrics` endpoint. Prometheus service discovery has been configured using Kubernetes service annotations, while resource-level metrics are collected through Node Exporter and Kube State Metrics.

Application-level request count and error-rate metrics would require Guestbook application instrumentation using Prometheus client libraries or an exporter sidecar.