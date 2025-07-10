import Album from '@/backend/db/models/album';
import Layout from '@/backend/db/models/layout';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  const album = await Album.findByPk(params.id);

  if (!album) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 });
  }

  try {
    const layout = await Layout.create(data);
    return NextResponse.json(layout);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create layout' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const album = await Album.findByPk(params.id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const layouts = await Layout.findOne({
      where: {
        albumId: params.id,
      },
    });

    return NextResponse.json(layouts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch layouts' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();

  try {
    const album = await Album.findByPk(params.id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const layout = await Layout.findOne({
      where: {
        albumId: params.id,
      },
    });

    if (!layout) {
      return NextResponse.json(
        { error: 'Layout not found for this album' },
        { status: 404 }
      );
    }

    await layout.update(data);

    return NextResponse.json(layout);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update layout' },
      { status: 500 }
    );
  }
}
