import { IAspect, TerraformResource } from 'cdktf'
import { IConstruct } from 'constructs'
import { RESOURCES_TO_EXCLUDE_TAGS } from './constants.js'

type TaggableConstruct = IConstruct & {
  tags?: { [key: string]: string } | string[]
  tagsInput?: { [key: string]: string } | string[]
}

function isTaggableConstruct(node: IConstruct): node is TaggableConstruct {
  return 'tags' in node && 'tagsInput' in node
}

export class TagsAddingAspect implements IAspect {
  constructor(
    private tagsToAdd: Record<string, string>,
    private tagsToIgnore: string[] = []
  ) {}

  // This method is called on every Construct within the specified scope (resources, data sources, etc.).
  visit(node: IConstruct) {
    // We need to take the input value to not create a circular reference
    if (!isTaggableConstruct(node)) {
      return
    }

    // Determine if the resource excludes `tags`
    if (RESOURCES_TO_EXCLUDE_TAGS.has(node.constructor.name)) {
      node.tags = undefined // Completely remove tags for this resource
      return
    }

    const currentTags = node.tagsInput || {}
    node.tags = { ...this.tagsToAdd, ...currentTags }

    // Add ignore_changes overrides for selected tags
    if (node instanceof TerraformResource && this.tagsToIgnore.length > 0) {
      const ignoreList = this.tagsToIgnore.map(tag => `tags["${tag}"]`)
      node.addOverride('lifecycle.ignore_changes', ignoreList)
    }
  }
}
