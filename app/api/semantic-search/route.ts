import { NextRequest, NextResponse } from 'next/server'

// Mock data for testing when database is not connected
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Return mock data for testing
    const mockQuotes = {
      results: [
        {
          id: '1',
          documentId: 'doc-1',
          fileName: 'sample-quote.pdf',
          quoteReference: 'Q2024-001',
          customer: {
            name: 'Sample Customer',
            company: 'Test Company Ltd',
            email: 'customer@example.com'
          },
          shipment: {
            originPort: 'Shanghai, China',
            destinationPort: 'Los Angeles, USA',
            weight: 2500,
            volume: 45,
            transitTime: 28
          },
          financialMetrics: {
            totalSellPrice: {
              amount: 15000,
              currency: 'USD'
            }
          },
          date_issued: '2024-01-15',
          notes: 'Sample quote for testing',
          specialConditions: ['Express handling', 'Temperature controlled'],
          extractionConfidence: 0.95,
          lineItems: [
            {
              description: 'Ocean Freight',
              category: 'Freight',
              sellPrice: {
                amount: 8000,
                currency: 'USD'
              },
              supplier: 'Shipping Line'
            },
            {
              description: 'Port Charges',
              category: 'Port Charges',
              sellPrice: {
                amount: 2000,
                currency: 'USD'
              },
              supplier: 'Port Authority'
            },
            {
              description: 'Documentation',
              category: 'Documentation',
              sellPrice: {
                amount: 500,
                currency: 'USD'
              },
              supplier: 'Internal'
            },
            {
              description: 'Inland Transport',
              category: 'Transport',
              sellPrice: {
                amount: 3500,
                currency: 'USD'
              },
              supplier: 'Trucking Co'
            },
            {
              description: 'Customs Clearance',
              category: 'Customs',
              sellPrice: {
                amount: 1000,
                currency: 'USD'
              },
              supplier: 'Customs Broker'
            }
          ]
        },
        {
          id: '2',
          documentId: 'doc-2',
          fileName: 'sample-quote-2.pdf',
          quoteReference: 'Q2024-002',
          customer: {
            name: 'Another Customer',
            company: 'Import Export Co',
            email: 'import@example.com'
          },
          shipment: {
            originPort: 'Hamburg, Germany',
            destinationPort: 'New York, USA',
            weight: 1800,
            volume: 32,
            transitTime: 21
          },
          financialMetrics: {
            totalSellPrice: {
              amount: 12000,
              currency: 'USD'
            }
          },
          date_issued: '2024-01-20',
          notes: 'Urgent shipment',
          specialConditions: ['Priority handling'],
          extractionConfidence: 0.92,
          lineItems: [
            {
              description: 'Ocean Freight',
              category: 'Freight',
              sellPrice: {
                amount: 6500,
                currency: 'USD'
              },
              supplier: 'Shipping Line'
            },
            {
              description: 'Port Charges',
              category: 'Port Charges',
              sellPrice: {
                amount: 1800,
                currency: 'USD'
              },
              supplier: 'Port Authority'
            },
            {
              description: 'Documentation',
              category: 'Documentation',
              sellPrice: {
                amount: 450,
                currency: 'USD'
              },
              supplier: 'Internal'
            },
            {
              description: 'Inland Transport',
              category: 'Transport',
              sellPrice: {
                amount: 2250,
                currency: 'USD'
              },
              supplier: 'Trucking Co'
            },
            {
              description: 'Customs Clearance',
              category: 'Customs',
              sellPrice: {
                amount: 1000,
                currency: 'USD'
              },
              supplier: 'Customs Broker'
            }
          ]
        }
      ],
      message: 'Using mock data - database not connected'
    }

    return NextResponse.json(mockQuotes)
  } catch (error) {
    console.error('Error in mock semantic-search:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}