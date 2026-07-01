import PDFDocument from 'pdfkit'
import { OFPResult, FlightLogEntry } from './ofp-generator.js'

function fmtNum(n: number): string { return n.toLocaleString('en-US') }

function line(doc: any, x1: number, y: number, x2: number) {
  doc.moveTo(x1, y).lineTo(x2, y).strokeColor('#000').stroke()
}

function headerBlock(doc: any, ofp: OFPResult, pageNum: number) {
  const h = ofp.header
  doc.fontSize(8).font('Courier-Bold')
  doc.text(`${h.flightNumber} ${h.date.slice(2)}/${h.depIcao}-${h.arrIcao} Page ${pageNum}`, 30, 30, { width: 540, align: 'center' })
  doc.fontSize(7).font('Courier')
  doc.text('[ OFP ]', 30, 40, { width: 540, align: 'center' })
  line(doc, 30, 46, 570)
}

function pageFooter(doc: any, ofp: OFPResult, pageNum: number, totalPages: number) {
  line(doc, 30, doc.page.height - 40, 570)
  doc.fontSize(6.5).font('Courier')
  doc.text('- Not for real world navigation -', 30, doc.page.height - 35, { width: 270, align: 'left' })
  doc.text(`${pageNum}`, 300, doc.page.height - 35, { width: 0, align: 'center' })
  const h = ofp.header
  doc.text(`${h.flightNumber} ${h.date.slice(2)}/${h.depIcao}-${h.arrIcao} Page ${pageNum}`, 300, doc.page.height - 35, { width: 270, align: 'right' })
}

export async function generateOFPPDF(ofp: OFPResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 30, right: 30 } })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const h = ofp.header
    let pageNum = 1
    const totalPages = 4

    // ── PAGE 1: Header, Fuel, Weights, Route ──
    headerBlock(doc, ofp, pageNum)
    doc.fontSize(7).font('Courier')

    let y = 52
    const L = 30
    const R = 570
    const col1 = 30
    const col2 = 200
    const col3 = 370
    const col4 = 470

    // Flight identification block
    doc.font('Courier-Bold')
    doc.text(`${h.flightNumber} ${ofp.header.date} ${h.depIcao}-${h.arrIcao} ${h.aircraftIcao} ${h.aircraftReg} RELEASE ${ofp.header.releaseTime} ${ofp.header.releaseDate}`, L, y + 2)
    y += 10
    doc.font('Courier')
    doc.text(`OFP ${ofp.header.ofpNumber} ${h.depName.toUpperCase()} -${h.arrName.toUpperCase()}`, L, y)
    y += 10
    doc.text(`WX PROG ${ofp.weatherInfo.wxProg} OBS ...... ...... ......`, L, y)
    y += 10
    doc.text(`ATC C/S ${h.flightNumber} ${h.depIcao}/${h.depIcao.slice(-3)} ${h.arrIcao}/${h.arrIcao.slice(-3)} CRZ SYS CI 5`, L, y)
    y += 10

    line(doc, L, y, R)
    y += 4

    // Route data
    doc.font('Courier-Bold')
    doc.text(`${ofp.header.date} ${h.aircraftReg} ${ofp.times.out}/${ofp.times.off} ${ofp.times.on}/${ofp.times.in} GND DIST ${ofp.route.totalDistance}`, L, y)
    y += 10
    doc.text(`${h.aircraftName} / LEAP-1B28 STA ..... AIR DIST ${ofp.route.airDistance}`, L, y)
    y += 10
    doc.text(`CTOT:.... G/C DIST ${ofp.route.groundDistance}`, L, y)
    y += 10
    doc.text(`AVG WIND ${ofp.route.avgWind}`, L, y)
    y += 10

    // TOW/LW/ZFW section
    doc.font('Courier')
    doc.text(`MAXIMUM TOW ${fmtNum(Math.round(ofp.weights.mtow * 1000))} LAW ${fmtNum(Math.round(ofp.weights.mlw * 1000))} ZFW ${fmtNum(Math.round(ofp.weights.mzfw * 1000))} AVG W/C ${ofp.route.avgWComponent > 0 ? `P${Math.abs(ofp.route.avgWComponent).toString().padStart(3, '0')}` : `M${Math.abs(ofp.route.avgWComponent).toString().padStart(3, '0')}`}`, L, y)
    y += 10
    doc.text(`ESTIMATED TOW ${fmtNum(Math.round(ofp.weights.tow * 1000))} LAW ${fmtNum(Math.round(ofp.weights.law * 1000))} ZFW ${fmtNum(Math.round(ofp.weights.zfw * 1000))} AVG ISA P${ofp.route.avgISA.toString().padStart(3, '0')}`, L, y)
    y += 10
    doc.text(`AVG FF KGS/HR ${ofp.route.avgFF}`, L, y)
    y += 10
    doc.text(`FUEL BIAS P00.0`, L, y)
    y += 10
    doc.text(`ALTN ${ofp.route.altnIcao} TKOF ALTN .......`, L, y)
    y += 10
    doc.text(`FL STEPS ${h.depIcao}/0380/KUPMA/0240`, L, y)
    y += 10

    line(doc, L, y, R)
    y += 4
    doc.text(`DISP RMKS NIL`, L, y)
    y += 10
    line(doc, L, y, R)
    y += 4

    // Fuel Plan Table
    doc.font('Courier-Bold')
    doc.text(' PLANNED FUEL', L, y)
    y += 10
    doc.text('---------------------------------', L, y)
    y += 10
    doc.text('FUEL', { continued: true }).text('ARPT', col2).text('FUEL', { continued: true }).text('TIME', col4)
    y += 10
    doc.text('---------------------------------', L, y)
    y += 10

    doc.font('Courier')
    const fuelRows: [string, string, number, string][] = [
      ['TRIP', ofp.header.arrIcao, ofp.fuel.tripFuel, '0' + Math.floor(ofp.fuel.tripFuelTime / 60).toString() + (ofp.fuel.tripFuelTime % 60).toString().padStart(2, '0')],
      ['CONT 15 MIN', '', ofp.fuel.contingencyFuel, '0015'],
      ['ALTN', ofp.route.altnIcao, ofp.fuel.alternateFuel, '0' + Math.floor(ofp.fuel.alternateTime / 60).toString() + (ofp.fuel.alternateTime % 60).toString().padStart(2, '0')],
      ['FINRES', '', ofp.fuel.finalReserve, '0030'],
    ]
    for (const [label, apt, fuel, time] of fuelRows) {
      doc.text(label, L, y)
      if (apt) doc.text(apt, col2, y, { width: 80 })
      doc.text(fmtNum(fuel), col3, y, { width: 70, align: 'right' })
      doc.text(time, col4, y, { width: 50, align: 'right' })
      y += 10
    }

    line(doc, L, y, R)
    y += 4
    doc.font('Courier-Bold')
    doc.text('MINIMUM T/OFF FUEL', L, y)
    doc.text(fmtNum(ofp.fuel.minimumTakeoffFuel), col3, y, { width: 70, align: 'right' })
    doc.text(`0${Math.floor(ofp.fuel.minimumTakeoffTime / 60)}${(ofp.fuel.minimumTakeoffTime % 60).toString().padStart(2, '0')}`, col4, y, { width: 50, align: 'right' })
    y += 10

    doc.font('Courier')
    doc.text('EXTRA', L, y)
    doc.text('0', col3, y, { width: 70, align: 'right' })
    doc.text('0000', col4, y, { width: 50, align: 'right' })
    y += 10

    doc.font('Courier-Bold')
    doc.text('T/OFF FUEL', L, y)
    doc.text(fmtNum(ofp.fuel.takeoffFuel), col3, y, { width: 70, align: 'right' })
    doc.text(`0${Math.floor(ofp.fuel.takeoffTime / 60)}${(ofp.fuel.takeoffTime % 60).toString().padStart(2, '0')}`, col4, y, { width: 50, align: 'right' })
    y += 10

    doc.font('Courier')
    doc.text('TAXI', L, y)
    doc.text(ofp.header.depIcao, col2, y, { width: 80 })
    doc.text(fmtNum(ofp.fuel.taxiFuel), col3, y, { width: 70, align: 'right' })
    doc.text('0020', col4, y, { width: 50, align: 'right' })
    y += 10
    line(doc, L, y, R)
    y += 4

    doc.font('Courier-Bold')
    doc.text('BLOCK FUEL', L, y)
    doc.text(ofp.header.depIcao, col2, y, { width: 80 })
    doc.text(fmtNum(ofp.fuel.blockFuel), col3, y, { width: 70, align: 'right' })
    y += 10

    doc.font('Courier')
    doc.text('PIC EXTRA .....', L, y)
    y += 10
    doc.text('TOTAL FUEL .....', L, y)
    y += 10
    doc.text('REASON FOR PIC EXTRA ............', L, y)
    y += 10

    line(doc, L, y, R)
    y += 4
    doc.text('FMC INFO:', L, y)
    y += 10
    doc.text(`FINRES+ALTN ${fmtNum(ofp.fuel.finalReserve + ofp.fuel.alternateFuel)}`, L, y)
    y += 10
    doc.text(`TRIP+TAXI ${fmtNum(ofp.fuel.tripFuel + ofp.fuel.taxiFuel)}`, L, y)
    y += 10
    line(doc, L, y, R)
    y += 4
    doc.text('NO TANKERING RECOMMENDED (P)', L, y)
    y += 12
    doc.text('I HEREWITH CONFIRM THAT I HAVE PERFORMED A THOROUGH SELF BRIEFING', L, y)
    y += 9
    doc.text('ABOUT THE DESTINATION AND ALTERNATE AIRPORTS OF THIS FLIGHT', L, y)
    y += 9
    doc.text('INCLUDING THE APPLICABLE INSTRUMENT APPROACH PROCEDURES, AIRPORT', L, y)
    y += 9
    doc.text('FACILITIES, NOTAMS AND ALL OTHER RELEVANT PARTICULAR INFORMATION.', L, y)
    y += 12
    doc.text(`DISPATCHER: ${ofp.dispatch.dispatcher}`, L, y)
    doc.text(`PIC NAME: ${ofp.dispatch.picName}`, col3, y)
    y += 10
    doc.text(`TEL: ${ofp.dispatch.dispatcherTel}`, L, y)
    doc.text(`PIC SIGNATURE: ...............`, col3, y)

    pageFooter(doc, ofp, pageNum, totalPages)

    // ── PAGE 2: Alternate, Routing, Operational Impacts ──
    pageNum++
    doc.addPage()
    headerBlock(doc, ofp, pageNum)
    y = 52

    doc.font('Courier-Bold')
    doc.text(`ALTERNATE ROUTE TO: FINRES ${fmtNum(ofp.fuel.finalReserve)}`, L, y)
    y += 12
    doc.fontSize(6.5).font('Courier')
    doc.text('APT', { continued: true }).text('TRK', col2).text('DST', col3).text('VIA', col4)
    y += 10
    line(doc, L, y, R)
    y += 4
    doc.text(`${ofp.route.altnIcao}/...`, L, y)
    doc.text('...', col2, y)
    doc.text('...', col3, y)
    doc.text(`... FL... .........`, col4, y)
    y += 14

    line(doc, L, y, R)
    y += 4
    doc.font('Courier-Bold').fontSize(7)
    doc.text('MEL/CDL ITEMS DESCRIPTION', L, y)
    y += 10
    doc.text('------------- -----------', L, y)
    y += 10
    doc.font('Courier')
    doc.text('NIL', L, y)
    y += 14
    line(doc, L, y, R)
    y += 4

    doc.font('Courier-Bold')
    doc.text('ROUTING:', L, y)
    y += 10
    doc.text('ROUTE ID: DEFRTE', L, y)
    y += 10
    doc.font('Courier')
    const routeLines = ofp.route.routeString.match(/.{1,80}/g) || [ofp.route.routeString]
    for (const rl of routeLines) {
      doc.text(rl, L, y)
      y += 9
    }
    y += 6

    line(doc, L, y, R)
    y += 4
    doc.text('DEPARTURE ATC CLEARANCE:', L, y)
    y += 10
    doc.text('.', L, y)
    y += 10
    doc.text('.', L, y)
    y += 14
    line(doc, L, y, R)
    y += 4

    doc.font('Courier-Bold')
    doc.text(' OPERATIONAL IMPACTS', L, y)
    y += 10
    doc.text(' -------------------', L, y)
    y += 10
    doc.font('Courier')
    doc.text('WEIGHT CHANGE UP 1.0 TRIP P 0065 KGS TIME P 0000', L, y)
    y += 9
    doc.text('WEIGHT CHANGE DN 1.0 TRIP M 0041 KGS TIME M 0001', L, y)
    y += 9
    doc.text('FL CHANGE UP FL1 NOT AVAILABLE', L, y)
    y += 9
    doc.text('FL CHANGE DN FL1 TRIP P 0032 KGS TIME P 0000', L, y)
    y += 9
    doc.text('FL CHANGE DN FL2 TRIP P 0020 KGS TIME P 0002', L, y)
    y += 9
    doc.text('SPD CHANGE CI 0 TRIP M 0014 KGS TIME P 0000', L, y)
    y += 9
    doc.text('SPD CHANGE CI 100 TRIP P 0168 KGS TIME M 0004', L, y)

    pageFooter(doc, ofp, pageNum, totalPages)

    // ── PAGE 3: Times, Weights, FMC ──
    pageNum++
    doc.addPage()
    headerBlock(doc, ofp, pageNum)
    y = 52

    doc.font('Courier-Bold')
    doc.text(' TIMES', L, y)
    y += 10
    doc.text(' -----', L, y)
    y += 8
    doc.font('Courier')
    doc.text('', L, y)
    y += 10
    doc.text('           ESTIMATED    SKED    ACTUAL', L, y)
    y += 10
    doc.text(`OUT ${ofp.times.out}Z/${thisTimezone(ofp.header.depIcao)}  ${ofp.times.out}Z/${thisTimezone(ofp.header.depIcao)}  ......Z`, L, y)
    y += 10
    doc.text(`OFF ${ofp.times.off}Z/${thisTimezone(ofp.header.depIcao)}  ${ofp.times.off}Z/${thisTimezone(ofp.header.depIcao)}  ......Z`, L, y)
    y += 10
    doc.text(`ON  ${ofp.times.on}Z/${thisTimezone(ofp.header.arrIcao)}  ${ofp.times.on}Z/${thisTimezone(ofp.header.arrIcao)}  ......Z`, L, y)
    y += 10
    doc.text(`IN  ${ofp.times.in}Z/${thisTimezone(ofp.header.arrIcao)}  ${ofp.times.in}Z/${thisTimezone(ofp.header.arrIcao)}  ......Z`, L, y)
    y += 10
    line(doc, L, y, R)
    y += 4
    doc.text(`BLOCK TIME 0${Math.floor(ofp.times.blockTime / 60)}${(ofp.times.blockTime % 60).toString().padStart(2, '0')}  0${Math.floor(ofp.times.blockTime / 60)}${(ofp.times.blockTime % 60).toString().padStart(2, '0')}  ......`, L, y)
    y += 16

    line(doc, L, y, R)
    y += 4
    doc.font('Courier-Bold')
    doc.text(' WEIGHTS', L, y)
    y += 8
    doc.text(' -------', L, y)
    y += 10
    doc.font('Courier')
    doc.text('            EST     MAX   ACTUAL', L, y)
    y += 10
    doc.text(`PAX  ${ofp.weights.paxCount}     ${ofp.weights.paxCount}  ......`, L, y)
    y += 10
    doc.text(`BAG/CARGO  ${(ofp.weights.cargo / 1000).toFixed(1)}  ......`, L, y)
    y += 10
    doc.text(`PAYLOAD  ${ofp.weights.payload.toFixed(1)}  ......`, L, y)
    y += 10
    doc.text(`ZFW  ${ofp.weights.zfw.toFixed(1)}  ${ofp.weights.mzfw.toFixed(1)}  ......`, L, y)
    y += 10
    doc.text(`FUEL  ${ofp.weights.fuelWeight.toFixed(1)}  ${ofp.weights.maxFuel.toFixed(1)}  ...... POSS EXTRA ${ofp.weights.fuelRemaining.toFixed(1)}`, L, y)
    y += 10
    doc.text(`TOW  ${ofp.weights.tow.toFixed(1)}  ${ofp.weights.mtow.toFixed(1)}  LDG......`, L, y)
    y += 10
    doc.text('STAB TRIM  ......', L, y)
    y += 10
    doc.text(`LAW  ${ofp.weights.law.toFixed(1)}  ${ofp.weights.mlw.toFixed(1)}  ......`, L, y)
    y += 16

    line(doc, L, y, R)
    y += 4
    doc.font('Courier-Bold')
    doc.text(' TERRAIN CLEARANCE CHECK', L, y)
    y += 8
    doc.text(' -----------------------', L, y)
    y += 10
    doc.font('Courier')
    doc.text('DD CHECK - TERRAIN CLEARANCE CHECK DISABLED', L, y)
    y += 10
    doc.text('DP CHECK - TERRAIN CLEARANCE CHECK DISABLED', L, y)
    y += 16

    line(doc, L, y, R)
    y += 4
    doc.font('Courier-Bold')
    doc.text(' COMPANY NOTAM', L, y)
    y += 8
    doc.text(' =============', L, y)
    y += 10
    doc.font('Courier')
    doc.text('CREW ALERT:', L, y)
    y += 10
    doc.text('WHEN PLANNING A COST INDEX, 2 OPTIONS ARE AVAILABLE. PILOTS MAY', L, y)
    y += 9
    doc.text('EITHER SELECT A SPECIFIC COST INDEX NUMBER FROM THE LIST, OR THEY', L, y)
    y += 9
    doc.text('MAY SELECT "AUTO". WHEN PLANNING AN "AUTO" COST INDEX, THE SYSTEM', L, y)
    y += 9
    doc.text('WILL REFERENCE THE SCHEDULED "TIME ENROUTE" OPTION AND ATTEMPT TO', L, y)
    y += 9

    pageFooter(doc, ofp, pageNum, totalPages)

    // ── PAGE 4: Weather, Dispatch ──
    pageNum++
    doc.addPage()
    headerBlock(doc, ofp, pageNum)
    y = 52

    doc.font('Courier-Bold')
    doc.text(' WIND INFORMATION', L, y)
    y += 10
    doc.text(' ----------------', L, y)
    y += 10
    doc.font('Courier')
    doc.text('CLIMB    T O C     SUGID    DOGET', L, y)
    y += 9
    for (const w of ofp.weatherInfo.windsAloft) {
      doc.text(`FL${w.altitude}   ${w.direction}/${w.speed.toString().padStart(3, '0')} -${Math.abs(w.temperature)}   .../...  -..   .../...  -..   .../...  -..`, L, y)
      y += 9
    }
    y += 10

    line(doc, L, y, R)
    y += 4
    doc.font('Courier-Bold')
    doc.text(' [ Airport WX List ]', L, y)
    y += 12
    doc.font('Courier')
    doc.text(`DEPARTURE: ${ofp.header.depIcao}/${ofp.header.depIcao.slice(-3)} ${ofp.header.depName.toUpperCase()}`, L, y)
    y += 10
    doc.text(`  ${ofp.metar.dep}`, L, y)
    y += 12
    doc.text(`DESTINATION: ${ofp.header.arrIcao}/${ofp.header.arrIcao.slice(-3)} ${ofp.header.arrName.toUpperCase()}`, L, y)
    y += 10
    doc.text(`  ${ofp.metar.arr}`, L, y)
    y += 12
    if (ofp.metar.alt) {
      doc.text(`DESTINATION ALTERNATE: ${ofp.route.altnIcao}`, L, y)
      y += 10
      doc.text(`  ${ofp.metar.alt}`, L, y)
    }
    y += 14

    line(doc, L, y, R)
    y += 4
    doc.font('Courier-Bold')
    doc.text(' [ DISPATCH BRIEFING INFO ]', L, y)
    y += 12
    doc.font('Courier')
    doc.text(`${ofp.header.flightNumber} ${ofp.header.depIcao}/${ofp.header.arrIcao}`, L, y)
    y += 14

    line(doc, L, y, R)
    y += 4
    doc.text(`DEPARTURE: ${ofp.header.depIcao}`, L, y)
    y += 10
    if (ofp.route.sid) doc.text(`SID: ${ofp.route.sid}`, L, y)
    y += 10
    doc.text(`DESTINATION: ${ofp.header.arrIcao}`, L, y)
    y += 10
    if (ofp.route.star) doc.text(`STAR: ${ofp.route.star}`, L, y)
    y += 10
    doc.text(`ALTERNATE: ${ofp.route.altnIcao}`, L, y)
    y += 20

    doc.text(`N O T A M   S U M M A R Y`, L, y)
    y += 10
    doc.text(`VALID: ${ofp.header.releaseDate} ${ofp.header.releaseTime} - ${ofp.header.releaseDate} ${ofp.header.releaseTime}`, L, y)
    y += 10
    doc.text(`ROUTE: ${ofp.route.routeString}`, L, y)
    y += 12
    doc.text(`NO ACTIVE NOTAMS FOR THIS ROUTE`, L, y)
    y += 16

    line(doc, L, y, R)
    y += 4
    doc.font('Courier-Bold')
    doc.text(`End of Document: ${h.flightNumber} ${ofp.header.date.slice(2)}/${h.depIcao}-${h.arrIcao}`, L, y)

    pageFooter(doc, ofp, pageNum, totalPages)
    doc.end()
  })
}

function thisTimezone(icao: string): string {
  const timezones: Record<string, string> = {
    VABB: '1715',
    VIDP: '1745',
    VOBL: '1730',
    VOMM: '1730',
    OMDB: '1820',
    OMAA: '1820',
  }
  return timezones[icao] || '1800'
}
