/**
 * PdfService.js
 * Generates a Belief Origin Tree PDF using @react-pdf/renderer
 */

import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer'
import React from 'react'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0A0A0A',
    color: '#D1D5DB',
    fontFamily: 'Helvetica',
    padding: 40,
  },
  header: {
    marginBottom: 30,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: 20,
  },
  brandTag: {
    fontSize: 8,
    letterSpacing: 3,
    color: '#818CF8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
  },
  beliefCard: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  beliefIndex: {
    fontSize: 32,
    color: 'rgba(255,255,255,0.05)',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  originMeta: {
    fontSize: 8,
    letterSpacing: 2,
    color: '#818CF8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  beliefText: {
    fontSize: 16,
    color: '#F9FAFB',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    lineHeight: 1.4,
  },
  analysis: {
    fontSize: 10,
    color: '#9CA3AF',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  costBox: {
    borderLeft: '2px solid rgba(129,140,248,0.5)',
    paddingLeft: 10,
    marginTop: 8,
  },
  costLabel: {
    fontSize: 7,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#818CF8',
    marginBottom: 4,
  },
  costText: {
    fontSize: 9,
    color: '#D1D5DB',
    fontStyle: 'italic',
  },
  summarySection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(129,140,248,0.05)',
    borderRadius: 8,
    border: '1px solid rgba(129,140,248,0.15)',
  },
  sectionLabel: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#818CF8',
    marginBottom: 6,
  },
  sectionValue: {
    fontSize: 11,
    color: '#E5E7EB',
  },
  illustration: {
    width: '100%',
    height: 140,
    borderRadius: 6,
    objectFit: 'cover',
    marginBottom: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
})

function BeliefOriginTreeDocument({ beliefTree }) {
  const summary = beliefTree?.session_summary || {}
  const nodes = beliefTree?.belief_nodes || []
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.brandTag }, 'MindRoots — Belief Archaeology Report'),
        React.createElement(Text, { style: styles.title }, summary.dominant_theme || 'Belief Origin Tree'),
        React.createElement(Text, { style: styles.subtitle }, `${dateStr} · ${nodes.length} Core Belief${nodes.length !== 1 ? 's' : ''} Excavated`),
      ),

      // Belief cards (first few per page)
      ...nodes.slice(0, 3).map((node, i) =>
        React.createElement(View, { key: i, style: styles.beliefCard },
          node.illustration_url && !node.illustration_url.startsWith('data:image/svg') &&
            React.createElement(Image, { src: node.illustration_url, style: styles.illustration }),
          React.createElement(Text, { style: styles.beliefIndex }, String(i + 1).padStart(2, '0')),
          React.createElement(Text, { style: styles.originMeta },
            `Origin: ${node.origin_year || '?'} age ${node.age_at_origin || '?'} · ${node.origin_person || 'Unknown'}`
          ),
          React.createElement(Text, { style: styles.beliefText }, `"${node.belief}"`),
          node.written_analysis && React.createElement(Text, { style: styles.analysis }, node.written_analysis),
          node.cost_today && React.createElement(View, { style: styles.costBox },
            React.createElement(Text, { style: styles.costLabel }, 'Cost today'),
            React.createElement(Text, { style: styles.costText }, node.cost_today),
          ),
        )
      ),

      // Summary section
      summary.overall_emotional_tone && React.createElement(View, { style: styles.summarySection },
        React.createElement(Text, { style: styles.sectionLabel }, 'Session Summary'),
        React.createElement(Text, { style: styles.sectionValue }, summary.overall_emotional_tone),
      ),

      // Footer
      React.createElement(Text, { style: styles.footer }, 'MINDROOTS INTROSPECTIVE SYSTEMS // CONFIDENTIAL'),
    ),

    // Second page for more beliefs
    nodes.length > 3 && React.createElement(Page, { size: 'A4', style: styles.page },
      ...nodes.slice(3).map((node, i) =>
        React.createElement(View, { key: i, style: styles.beliefCard },
          React.createElement(Text, { style: styles.beliefIndex }, String(i + 4).padStart(2, '0')),
          React.createElement(Text, { style: styles.originMeta },
            `Origin: ${node.origin_year || '?'} age ${node.age_at_origin || '?'} · ${node.origin_person || 'Unknown'}`
          ),
          React.createElement(Text, { style: styles.beliefText }, `"${node.belief}"`),
          node.written_analysis && React.createElement(Text, { style: styles.analysis }, node.written_analysis),
          node.cost_today && React.createElement(View, { style: styles.costBox },
            React.createElement(Text, { style: styles.costLabel }, 'Cost today'),
            React.createElement(Text, { style: styles.costText }, node.cost_today),
          ),
        )
      ),
      React.createElement(Text, { style: styles.footer }, 'MINDROOTS INTROSPECTIVE SYSTEMS // CONFIDENTIAL'),
    ),
  )
}

export default async function generateBeliefPdf(beliefTree) {
  const doc = React.createElement(BeliefOriginTreeDocument, { beliefTree })
  const instance = pdf(doc)
  const blob = await instance.toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
